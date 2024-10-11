import {
	onLCP,
	onTTFB,
	onFCP,
	onFID,
	FCPMetric,
	LCPMetric,
	FIDMetric,
	TTFBMetric,
} from "web-vitals";
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
	encoded_size_kb: number;
	page_path: string;
}

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

	constructor(params: PerforgoParams) {
		this.appId = params.appId;

		this.enabledFeatures = params?.enabledFeatures || {};

		this.domainName = params?.domainName || window.location.hostname;

		if (!import.meta.env.DEV) {
			this._apiEndpoint =
				"https://api.perforgo.com/api/app/" +
				this.appId +
				"/analytics/resources/add";
		} else {
			this._apiEndpoint =
				"http://localhost:8003/api/app/" +
				this.appId +
				"/analytics/resources/add";
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
		 * LCP requires interaction with page before being reported
		 * https://web.dev/articles/vitals-spa-faq
		 *
		 */
		if (this.enabledFeatures.lcp) onLCP((e) => this.#sendToAnalytics(e));
		if (this.enabledFeatures.fcp) onFCP((e) => this.#sendToAnalytics(e));
		if (this.enabledFeatures.fid) onFID((e) => this.#sendToAnalytics(e));
		if (this.enabledFeatures.ttfb) onTTFB((e) => this.#sendToAnalytics(e));

		if (this.enabledFeatures.resourceMonitoring) {
			const observer = new PerformanceObserver((entries) => {
				entries.getEntries().forEach((entry: PerformanceEntry) => {
					if (entry.entryType === "resource") {
						const resourceEntry =
							entry as PerformanceResourceTiming;
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
					await this.#batchSendAnalytics(
						this.resourceMonitoringResultsToSend
					),
				this.requestThrottleMs
			);
		}
	}

	get apiEndpoint() {
		return this._apiEndpoint;
	}

	#sendToAnalytics(metric: LCPMetric | FCPMetric | FIDMetric | TTFBMetric) {
		console.warn("Web vitals are not yet supported", metric);

		// const body = JSON.stringify(metric)
		// ;(navigator.sendBeacon &&
		// 	navigator.sendBeacon(this.apiEndpoint, body)) ||
		// 	fetch(this.apiEndpoint, {
		// 		body,
		// 		method: 'POST',
		// 		keepalive: true,
		// 	})
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
			await fetch(this.apiEndpoint, {
				body,
				method: "POST",
				keepalive: true,
				headers: {
					"Content-Type": "application/json",
					Accept: "aplication/json",
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
				await this.#batchSendAnalytics(
					this.resourceMonitoringResultsToSend
				),
			this.requestThrottleMs
		);
	}

	#toKB(octets: number) {
		return octets * 8 * 1024;
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
				encoded_size_kb: this.#toKB(entry.encodedBodySize),
				page_path: window.location.pathname,
			});
		}
	}
}
