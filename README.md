# astro-lit 🚀🔥

This Astro integration enables server-side rendering and client-side hydration for your [Lit](https://lit.dev/) custom elements.

## Documentation

Example using Web Awesome

```astro
---
// server imports
import "@awesome.me/webawesome/dist/components/page/page.js"
import "@awesome.me/webawesome/dist/components/button/button.js"
---


<body>
  <wa-page>
    <wa-button>Click me!</wa-button>
  </wa-page>
  <script>
    // These 2 imports must come first before importing any components.
    import "@awesome.me/astro-lit/client-shim.js"
    import "@lit-labs/ssr-client/lit-element-hydrate-support.js"

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
