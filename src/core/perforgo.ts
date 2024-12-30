import {
  onLCP,
  onTTFB,
  // onFCP,
  // onFID,
  FCPMetric,
  LCPMetric,
  FIDMetric,
  TTFBMetric,
} from "web-vitals/attribution";
import { uid } from "uid";

interface PerforgoFeatures {
  lcp?: boolean;
  fid?: boolean;
  fcp?: boolean;
  ttfb?: boolean;
  resourceMonitoring?: {
    images: boolean;
  };
}

interface PerforgoParams {
  appId: string;
  enabledFeatures?: PerforgoFeatures;
  domainName?: string;
}

interface ResourceMonitoringResultToSend {
  perforgo_resource_id: string;
  resource_domain: string;
  resource_path: string;
  hostname: string;
  type: "img";
  transfer_size: number;
  page_path: string;
}

interface AdditionalWebVitalData {
  hostname: string
  page_path: string
}

type WebVitalMetric = FCPMetric | LCPMetric | FIDMetric | TTFBMetric;

type ResourceMonitoringResultsToSend = Array<ResourceMonitoringResultToSend>;

export default class Perforgo implements PerforgoParams {
  declare appId;
  declare enabledFeatures;
  declare domainName;
  declare _apiEndpoint;

  resourceMonitoringResultsToSend: ResourceMonitoringResultsToSend;
  timeoutId: number | null;
  requestThrottleMs: number;
  sending: boolean;
  sentResults: ResourceMonitoringResultsToSend;
  webVitalsQueue: Set<unknown>;
  resourcesEndpoint: string;
  webVitalsEndpoint: string;

  constructor(params: PerforgoParams) {
    this.appId = params.appId;

    this.enabledFeatures = params?.enabledFeatures || {};

    this.domainName = params?.domainName || window.location.hostname;

    this.webVitalsQueue = new Set();

    this.resourcesEndpoint = "/resources/add";

    this.webVitalsEndpoint = "/web-vitals/add";

    if (!import.meta.env.DEV) {
      this._apiEndpoint =
        "https://api.perforgo.com/api/app/" + this.appId + "/analytics";
    } else {
      this._apiEndpoint =
        "http://localhost:8001/api/app/" + this.appId + "/analytics";
    }

    this.resourceMonitoringResultsToSend = [];

    this.timeoutId = null;

    this.requestThrottleMs = 3000;

    this.sending = false;

    this.sentResults = [];
  }

  init() {
    if (!this.appId) {
      /* eslint-disable-next-line */
      console.error(
        "You need to specify a Perforgo App ID. Analytics reporting is disabled."
      );

      return;
    }

    /**
     *
     * LCP only reported on initial page load.
     * LCP requires interaction with page before being reported.
     * https://web.dev/articles/vitals-spa-faq
     *
     */
    if (this.enabledFeatures.lcp) {
      onLCP(
        (e) => this.#addToQueue(e, {
          hostname: window?.location?.hostname,
          page_path: window?.location?.pathname
        })
      );
    }

    if (this.enabledFeatures.fcp) {
      if (import.meta.env.DEV) {
        console.warn("FCP is not yet enabled, skipping.");
      }

      // onFCP((e) => this.#addToQueue(e));
    }
    if (this.enabledFeatures.fid) {
      if (import.meta.env.DEV) {
        console.warn("FID is not yet enabled, skipping.");
      }

      // onFID((e) => this.#addToQueue(e));
    }
    if (this.enabledFeatures.ttfb) {
      onTTFB((e) => this.#addToQueue(e, {
        hostname: window?.location?.hostname,
        page_path: window?.location?.pathname
      }));
    }

    if (this.enabledFeatures.resourceMonitoring) {
      const observer = new PerformanceObserver((entries) => {
        entries.getEntries().forEach((entry: PerformanceEntry) => {
          if (entry.entryType === "resource") {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.#buildResourceMonitoringPayload(resourceEntry);
          }
        });
      });

      observer.observe({ type: "resource", buffered: true });

      const records = observer.takeRecords();
      records.forEach((record) => {
        if (record.entryType === "resource") {
          const resourceEntry = record as PerformanceResourceTiming;
          this.#buildResourceMonitoringPayload(resourceEntry);
        }
      });

      this.timeoutId = setTimeout(
        async () =>
          await this.#batchSendAnalytics(this.resourceMonitoringResultsToSend),
        this.requestThrottleMs
      );
    }

    // Report all available metrics whenever the page is backgrounded or unloaded.
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.#flushQueue();
      }
    });
  }

  get apiEndpoint() {
    return this._apiEndpoint;
  }

  async #batchSendAnalytics(resultsToSend: ResourceMonitoringResultsToSend) {
    let deduplicatedResultsToSend = [];
    let body = null;

    if (!resultsToSend.length) return;

    /**
     * Remove any values in resultsToSend that have a matching perforgo_id in sentResults.
     *
     * These are duplicates and should not be recorded twice.
     *
     * Once deduplicated reset sentResults to an empty array to allow fresh set of sent results to be
     * checked against on the next request.
     */
    deduplicatedResultsToSend = resultsToSend.filter((resultToSend) => {
      /**
       *
       * If an index is found then filter it out by returning false
       *
       */
      if (
        this.sentResults.findIndex(
          (sentResult) =>
            sentResult.perforgo_resource_id ===
            resultToSend.perforgo_resource_id
        ) >= 0
      ) {
        return false;
      }

      return true;
    });

    /**
     *
     * If there are no results in the deduplicated results to send then there is
     * nothing new to send, therefore do nothing.
     *
     */
    if (!deduplicatedResultsToSend.length) {
      return;
    }

    body = JSON.stringify(deduplicatedResultsToSend);

    if (this.sending) return;

    this.sending = true;

    try {
      await fetch(this.apiEndpoint + this.resourcesEndpoint, {
        body,
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      this.sentResults.push(...deduplicatedResultsToSend);
      this.sending = false;
    } catch (e) {
      /* eslint-disable-next-line */
      console.log(e);
    }
  }

  #resetTimeout() {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(
      async () =>
        await this.#batchSendAnalytics(this.resourceMonitoringResultsToSend),
      this.requestThrottleMs
    );
  }

  #toKB(octets: number) {
    return octets;
  }

  #buildResourceMonitoringPayload(entry: PerformanceResourceTiming) {
    this.#resetTimeout();

    // The result was cached — do not measure
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) return;

    if (
      this.enabledFeatures?.resourceMonitoring?.images &&
      entry.initiatorType === "img"
    ) {
      this.resourceMonitoringResultsToSend.push({
        perforgo_resource_id: uid(),
        resource_domain: new URL(entry.name).hostname,
        resource_path: new URL(entry.name).pathname,
        hostname: this.domainName,
        type: entry.initiatorType,
        transfer_size: this.#toKB(entry.transferSize),
        page_path: window.location.pathname,
      });
    }
  }

  #addToQueue(metric: WebVitalMetric, additionalData: AdditionalWebVitalData) {
    this.webVitalsQueue.add({
      ...metric,
      ...additionalData
    });
  }

  #flushQueue() {
    if (this.webVitalsQueue.size > 0) {
      // Replace with whatever serialization method you prefer.
      // Note: JSON.stringify will likely include more data than you need.
      const body = JSON.stringify([...this.webVitalsQueue]);

      // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
      (navigator.sendBeacon &&
        navigator.sendBeacon(
          this.apiEndpoint + this.webVitalsEndpoint,
          new Blob([body], { type: 'application/json' })
        )) ||
        fetch(this.apiEndpoint + this.webVitalsEndpoint, {
          body,
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

      this.webVitalsQueue.clear();
    }
  }
}
