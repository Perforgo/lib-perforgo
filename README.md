# Perforgo

This is the code responsible for capturing performance events on the browser and forwarding them to the Perforgo analytical system for processing and showing on the Perforgo dashboard.

[Sign up](https://app.perforgo.com) for free to start capturing and monitoring performance events, and show your boss the amazing improvements you're making!

## Installation

The Perforgo library can be installed in a variety of ways:

### CDN

The easiest way to use Perforgo:

```
<script src="https://cdn.jsdelivr.net/npm/@perforgo/lib@latest/dist/cdn/perforgo.umd.js" async />
```

### NPM

1. Install the package from NPM

```
npm install @perforgo/lib@latest
```

2. Import the package into your JavaScript file

```
import { Perforgo } from '@perforgo/lib'
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
            excludedDomains: string
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
            excludedDomains: string
        }
    }
},
```
