// Separate import from the rest so it doesn't get re-organized after other imports
import './server-shim.js';

import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import * as parse5 from 'parse5';

import * as url from 'node:url';
import * as path from "node:path"
import {readFileSync} from "node:fs"
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const data = JSON.parse(readFileSync(path.join(__dirname, "./package.json"), { encoding: "utf8" }))
const packageName = data.name

class ServerRenderer {
	// Keep a static cache of elements so we don't have to iterate for attributes all the time.
	static constructorCache = new WeakMap();

	*render(Component, attrs, slots) {
		let tagName = Component;
		if (typeof tagName !== 'string') {
			tagName = Component[Symbol.for('tagName')];
		}
		const instance = new LitElementRenderer(tagName);

		// LitElementRenderer creates a new element instance, so copy over.
		const Ctr = getCustomElementConstructor(tagName);
		let shouldDeferHydration = false;

		if (attrs) {
			// `Ctr.elementProperties` is a Map keyed by *property* name. Build a
			// reverse lookup from *attribute* name -> property name so we can resolve
			// authored attributes whose name differs from the property (e.g. a
			// property declared with `attribute: 'my-attr'`).

			let propByAttr = /** @type {typeof ServerRenderer} */ (this.constructor).constructorCache.get(Ctr)

			if (!propByAttr) {
				propByAttr = new Map()
				for (const [propName, options] of Ctr.elementProperties) {
					if (options.attribute === false) continue; // property has no attribute
					const attrName =
						typeof options.attribute === 'string' ? options.attribute : propName;
					propByAttr.set(attrName, propName);
				}
			}

			for (let [name, value] of Object.entries(attrs)) {
				const isAttributeBackedProperty = propByAttr.has(name);
				// A reactive property with `attribute: false` — authored on the element
				// but with no associated attribute to serialize the value into.
				const isPropertyOnly = !isAttributeBackedProperty && name in Ctr.prototype;

				if (isPropertyOnly) {
					// The value can't be serialized into HTML, so set it as a property
					// and defer hydration until something re-applies it on the client
					// (an <astro-island>, or a manual hydration kickoff). Without that,
					// the value is lost on the client and hydration would clobber the
					// SSR'd output.
					instance.setProperty(name, value);
					shouldDeferHydration = true;
				} else {
					// Either a plain attribute or a reactive property backed by an
					// attribute. Setting it as an attribute serializes the value into the
					// SSR HTML *and* reflects it onto the property (via
					// attributeChangedCallback), so the client reads it back during
					// hydration with no island required — and no defer-hydration needed.
					instance.setAttribute(name, value);
				}
			}
		}

		instance.connectedCallback();

		yield `<${tagName}${shouldDeferHydration ? ' defer-hydration' : ''}`;
		yield* instance.renderAttributes();
		yield `>`;
		const shadowContents = instance.renderShadow({
			elementRenderers: [LitElementRenderer],
			customElementInstanceStack: [instance],
			customElementHostStack: [instance],
			eventTargetStack: [instance.element],
			slotStack: [],
			deferHydration: false,
		});
		if (shadowContents !== undefined) {
			const { mode = 'open', delegatesFocus } = instance.shadowRootOptions ?? {};
			// `delegatesFocus` is intentionally allowed to coerce to boolean to
			// match web platform behavior.
			const delegatesfocusAttr = delegatesFocus ? ' shadowrootdelegatesfocus' : '';
			yield `<template shadowroot="${mode}" shadowrootmode="${mode}"${delegatesfocusAttr}>`;
			yield* shadowContents;
			yield '</template>';
		}
		if (slots) {
			for (let [slot, value = ''] of Object.entries(slots)) {
				if (slot !== 'default' && value) {
					// Parse the value as a concatenated string
					const fragment = parse5.parseFragment(`${value}`);

					// Add the missing slot attribute to child Element nodes
					for (const node of fragment.childNodes) {
						if (node.tagName && !node.attrs.some(({ name }) => name === 'slot')) {
							node.attrs.push({ name: 'slot', value: slot });
						}
					}

					value = parse5.serialize(fragment);
				}

				yield value;
			}
		}
		yield `</${tagName}>`;
	}
}

function isCustomElementTag(name) {
	return typeof name === 'string' && name.includes('-');
}

function getCustomElementConstructor(name) {
	if (typeof customElements !== 'undefined' && isCustomElementTag(name)) {
		return customElements.get(name) || null;
	} else if (typeof name === 'function') {
		return name;
	}
	return null;
}

async function isLitElement(Component) {
	const Ctr = getCustomElementConstructor(Component);
	return !!Ctr?._$litElement$;
}

async function check(Component) {
	// Lit doesn't support getting a tagName from a Constructor at this time.
	// So this must be a string at the moment.
	return !!(await isLitElement(Component));
}

const serverRenderer = new ServerRenderer()

async function renderToStaticMarkup(Component, props, slots) {
	let tagName = Component;

	let out = [];
	for (let chunk of serverRenderer.render(tagName, props, slots)) {
		out.push(chunk);
	}

	return {
		html: out.join(""),
	};
}

export default {
	name: packageName,
	check,
	renderToStaticMarkup,
};
