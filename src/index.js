// @ts-check
import { readFileSync } from 'node:fs';
import * as url from 'node:url';
import * as path from 'node:path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(path.join(__dirname, "../package.json"), { encoding: "utf8" }))
const packageName = data.name

function getViteConfiguration() {
	return {
		optimizeDeps: {
			include: [
				`${packageName}/src/client.js`,
				`${packageName}/dsd-polyfill.js`,
				`${packageName}/hydration-support.js`,
				'@webcomponents/template-shadowroot/template-shadowroot.js',
				'@lit-labs/ssr-client/lit-element-hydrate-support.js',
			],
			exclude: [`${packageName}/server.js`],
		},
		ssr: {
			external: ['lit-element', '@lit-labs/ssr', `${packageName}`, 'lit/decorators.js'],
		},
	};
}

/**
 * @returns {import("astro").ContainerRenderer}
 */
export function getContainerRenderer() {
	return {
		name: packageName,
		serverEntrypoint: packageName,
	};
}


/**
 * @returns {import("astro").AstroIntegration}
 */
export default function () {
	return {
		name: packageName,
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer }) => {
				// Previously, this used `injectScript()`, however, it seems error prone and instead just have people make sure they do their imports properly.
				// Add the lit renderer so that Astro can understand lit components.
				addRenderer({
					name: packageName,
					serverEntrypoint: `${packageName}/server.js`,
					clientEntrypoint: `${packageName}/src/client.js`,
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
