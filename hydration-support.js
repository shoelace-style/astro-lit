// @ts-check
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

// astro-lit's SSR renderer adds "defer-hydration" to any element where it
// sets a non-reflected reactive property. That attribute is normally
// removed by astro-lit's client.js when an <astro-island> resumes the
// component — but these components are plain SSR custom elements (no
// client:* directive / no island), so nothing ever removes it and they
// stay un-hydrated. Resume hydration ourselves once each is defined.
for (const el of document.querySelectorAll('[defer-hydration]')) {
	if (el.closest('astro-island')) continue; // islands are handled by client.js
	const tag = el.localName;
	customElements.whenDefined(tag).then(() => el.removeAttribute('defer-hydration'));
}
