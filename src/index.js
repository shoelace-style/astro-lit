// @ts-check
import { readFileSync } from 'node:fs';

function getViteConfiguration() {
	return {
		optimizeDeps: {
			include: [
				'astro-lit/src/client.js',
				'astro-lit/client-shim.js',
				'astro-lit/hydration-support.js',
				'@webcomponents/template-shadowroot/template-shadowroot.js',
				'@lit-labs/ssr-client/lit-element-hydrate-support.js',
			],
			exclude: ['astro-lit/server.js'],
		},
		ssr: {
			external: ['lit-element', '@lit-labs/ssr', '@astrojs/lit', 'lit/decorators.js'],
		},
	};
}

/**
 * @returns {import("astro").ContainerRenderer}
 */
export function getContainerRenderer() {
	return {
		name: 'astro-lit',
		serverEntrypoint: 'astro-lit',
	};
}


/**
 * @returns {import("astro").AstroIntegration}
 */
export default function () {
	return {
		name: 'astro-lit',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer, injectScript }) => {
				// Inject the necessary polyfills on every page (inlined for speed).
				injectScript(
					'head-inline',
					readFileSync(new URL('../client-shim.min.js', import.meta.url), { encoding: 'utf-8' }),
				);
				// Inject the hydration code, before a component is hydrated.
				injectScript('before-hydration', `import '@astrojs/lit/hydration-support.js';`);
				// Add the lit renderer so that Astro can understand lit components.
				addRenderer({
					name: 'astro-lit',
					serverEntrypoint: 'astro-lit/server.js',
					clientEntrypoint: 'astro-lit/src/client.js',
				});
				// Update the vite configuration.
				updateConfig({
					vite: getViteConfiguration(),
				});
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					if (!vite.ssr) {
						vite.ssr = {};
					}
					if (!vite.ssr.noExternal) {
						vite.ssr.noExternal = [];
					}
					if (Array.isArray(vite.ssr.noExternal)) {
						vite.ssr.noExternal.push('lit');
					}
				}
			},
		},
	};
}
