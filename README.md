# `@awesome.me/astro-lit` 🚀🔥

This Astro integration enables server-side rendering and client-side hydration for your [Lit](https://lit.dev/) custom elements.

## Why?

<https://docs.astro.build/en/guides/integrations-guide/lit/> - The official Lit plugin by the Astro team was deprecated. It needed to be revived to work with new Astro versions and new SSR rendering from Lit.

<https://www.npmjs.com/package/@semantic-ui/astro-lit> is a fork I discovered after making this fork, but I noticed it had a few problems around attribute serialization, and head injection felt error prone and I constantly got components rendering multiple times.

## Documentation

### Installation

- npm

`npm install @awesome.me/astro-lit`

pnpm

`pnpm add @awesome.me/astro-lit`

yarn

`yarn add @awesome.me/astro-lit`


### Configuration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

import lit from '@awesome.me/astro-lit';

// https://astro.build/config
export default defineConfig({
  // ...
  integrations: [lit()],
});
```

### Using components

Example using Web Awesome:


```astro
---
// server imports.
import "@awesome.me/webawesome/dist/components/page/page.js"
import "@awesome.me/webawesome/dist/components/button/button.js"
---


<body>
  <wa-page>
    <wa-button>Click me!</wa-button>
  </wa-page>
  <script>
    // **!! VERY IMPORTANT !!**
    // These 2 imports must come first before importing any components on the client. If not, you will end up with things rendering more than once and things will look very, very broken.
    import "@awesome.me/astro-lit/dsd-polyfill.js"
    import "@awesome.me/astro-lit/hydration-support.js"

    // client imports
    import "@awesome.me/webawesome/dist/components/page/page.js"
    import "@awesome.me/webawesome/dist/components/button/button.js"
  </script>
</body>
```

## License

MIT

Copyright (c) 2023–2026    - Astro
Copyright (c) 2026-present - Font Awesome
