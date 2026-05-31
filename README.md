# Perforgo

This is the code responsible for capturing performance events on the browser and forwarding them to the Perforgo analytical system for processing and showing on the Perforgo dashboard.

[Sign up](https://app.perforgo.com) for free to start capturing and monitoring performance events, and show your boss the amazing improvements you're making!

## Contents

- [Installation Methods](#installation)
  - [CDN](#cdn)
  - [NPM](#npm)
  - [Nuxt 3 Module](#nuxt-3-module)
  - [Next.js (App Router)](#nextjs-app-router)
- [Resource Sampling](#resource-monitoring-sample-rate)
- [Available Options](#available-options)

## Installation

The Perforgo library can be installed in a variety of ways:

### CDN

The easiest way to use Perforgo is to add the script into the `<head>` of every page on your website. This way you get automatic updates when we apply new changes to the Perforgo script.

```
<script async src="https://cdn.jsdelivr.net/npm/@perforgo/lib@latest/dist/cdn/perforgo.umd.js" onload="
  const perforgoInstance = new Perforgo({
    appId: 'YOUR_APP_ID',
    domainName: 'YOUR_DOMAIN_NAME',
  });
  perforgoInstance.init();">
</script>
```

### NPM

1. Install the package from NPM

```
npm install @perforgo/lib@latest
```

2. Import the package into your JavaScript file

```
import Perforgo from '@perforgo/lib'
```

3. Configure the Perforgo instance

```
const perforgo = new Perforgo({
    appId: 'your-perforgo-generated-id',
    domainName: 'your-domain.com'
})
```

4. Initialise your new Perforgo instance

```
perforgo.init()
```

All events are sent by default but you can optionally configure which events you want to send:

```
const perforgo = new Perforgo({
    appId: 'your-perforgo-generated-id',
    domainName: 'your-domain.com',
    enabledFeatures: {
        lcp: boolean,
        ttfb: boolean,
        inp: boolean,
        cls: boolean,
        resourceMonitoring: boolean | {
            images: boolean
            excludedDomains: string[]
            sampleRate: number
        }
    }
})
```

### Nuxt 3 Module

We've developed a handy Nuxt 3 module which slots Perforgo neatly into the Nuxt 3 lifecycle.

_Note: We've only tested this on versions of Nuxt between 3.17 and less than Nuxt 4. Please raise an issue if it's not working on Nuxt 4 or less than 3.17._

1. Install the package from NPM

```
npx nuxi module add @perforgo/nuxt
```

2. Add to modules array in nuxt.config.ts

```
modules: [
    "@perforgo/nuxt"
]
```

3. Configure the module by adding the Perforgo key to the nuxt.config.ts with the following:

```
perforgo: {
    enabled: true,
    appId: 'your-perforgo-generated-id',
    domainName: 'your-domain.com'
},
```

All events are sent by default but you can optionally configure which events you want to send:

```
perforgo: {
    enabled: true,
    appId: 'your-perforgo-generated-id',
    domainName: 'your-domain.com',
    enabledFeatures: {
        lcp: boolean,
        ttfb: boolean,
        inp: boolean,
        cls: boolean,
        resourceMonitoring: boolean | {
            images: boolean
            excludedDomains: string[]
            sampleRate: number
        }
    }
},
```

### Next.js (App Router)

1. Create client component <PerforgoScript />

```
'use client'

import Script from 'next/script'

export function PerforgoScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/@perforgo/lib@latest/dist/cdn/perforgo.umd.js"
      strategy="afterInteractive"
      onLoad={() => {
        const perforgoInstance = new (window as any).Perforgo({
          appId: 'YOUR_APP_ID',
          domainName: 'YOUR_DOMAIN_NAME',
        })
        perforgoInstance.init()
      }}
    />
  )
}
```

2. Add to layout

```
import { PerforgoScript } from './PerforgoScript'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PerforgoScript />
      </body>
    </html>
  )
}
```

## Resource monitoring sample rate

When `resourceMonitoring` is enabled (either as `true` or as an object), image events are sampled at **10% by default** (`sampleRate: 0.1`). This prevents millions of image events from being recorded on high-traffic pages and quickly consuming your Perforgo event quota while still providing a representative indication of resource performance.

You can increase the sample rate up to `1` (100%) using the object syntax:

```
resourceMonitoring: {
    sampleRate: 1 // record every image event
}
```

Or reduce it further for very high-traffic sites:

```
resourceMonitoring: {
    sampleRate: 0.05 // record 5% of image events
}
```

## Available options

### `PerforgoParams`

These are the top-level options passed to `new Perforgo({...})`.

| Option            | Type               | Required | Default                    | Description                                     |
| ----------------- | ------------------ | -------- | -------------------------- | ----------------------------------------------- |
| `appId`           | `string`           | Yes      | —                          | Your Perforgo application ID                    |
| `domainName`      | `string`           | No       | `window.location.hostname` | The domain name associated with captured events |
| `enabledFeatures` | `PerforgoFeatures` | No       | All features enabled       | Configure which performance features are active |

### `PerforgoFeatures`

All features are enabled by default. Set any to `false` to disable.

| Option               | Type                                   | Default | Description                                                                                          |
| -------------------- | -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `lcp`                | `boolean`                              | `true`  | Capture Largest Contentful Paint events                                                              |
| `inp`                | `boolean`                              | `true`  | Capture Interaction to Next Paint events                                                             |
| `ttfb`               | `boolean`                              | `true`  | Capture Time to First Byte events                                                                    |
| `cls`                | `boolean`                              | `true`  | Capture Cumulative Layout Shift events                                                               |
| `fcp`                | `boolean`                              | `true`  | Capture First Contentful Paint events                                                                |
| `resourceMonitoring` | `boolean \| ResourceMonitoringOptions` | `true`  | Monitor resource loading performance. Pass `false` to disable, or an object for fine-grained control |

### `ResourceMonitoringOptions`

Passed as an object to `resourceMonitoring` for fine-grained control.

| Option            | Type              | Default | Description                                               |
| ----------------- | ----------------- | ------- | --------------------------------------------------------- |
| `images`          | `boolean`         | `true`  | Track image resource timing events                        |
| `sampleRate`      | `number`          | `0.1`   | Fraction of image events to record (0–1). Defaults to 10% |
| `excludedDomains` | `ExcludeDomain[]` | `[]`    | Domains to exclude from resource monitoring               |

### `ExcludeDomain`

| Option       | Type                    | Required | Default   | Description                                                                                        |
| ------------ | ----------------------- | -------- | --------- | -------------------------------------------------------------------------------------------------- |
| `domainName` | `string`                | Yes      | —         | The domain name to exclude                                                                         |
| `matchType`  | `"exact" \| "includes"` | No       | `"exact"` | Whether to match the full hostname exactly, or exclude any hostname that includes the given string |
