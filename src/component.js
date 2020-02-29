import Bimap from './bimap';

/**
 * @template {Component} T
 * @typedef {new (attributes:Object<string, string>, children:Node[]) => T} ComponentType
 */

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	/**
	 * Constructs a component.
	 * @param {Object<string, string>} [attributes] - The attributes passed as if it were <Component attrib=''...>
	 * @param {Node[]} [children] - The children of the node as if it were <Component><child1/>...</Component>
	 */
	constructor(attributes, children) {
		// Make sure the component is registered.
		let registryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		if (registryEntry === undefined) {
			throw new Error('The component "' + this.constructor.name + '" has not been registered.');
		}

		/**
		 * The root elements.
		 * @type {Node[]}
		 * @private
		 */
		this._rootNodes = [];

		/**
		 * The set of child components.
		 * @type {Set<Component>}
		 * @private
		 */
		this._components = new Set();

		/**
		 * The mapping of references to elements.
		 * @type {Bimap<string, Element>}
		 * @private
		 */
		this._elementRefs = new Bimap();

		/**
		 * The mapping of references to child components.
		 * @type {Bimap<string, Component>}
		 * @private
		 */
		this._componentRefs = new Bimap();

		// Set the HTML of the root element.
		if (registryEntry && registryEntry.html !== '') {
			// Create the template and add the html content as the root node.
			const templateElem = document.createElement('template');
			templateElem.innerHTML = registryEntry.html;
			this._rootNodes = [...templateElem.content.cloneNode(true).childNodes];

			// Set the event handlers and child components.
			for (const node of this._rootNodes) {
				if (node instanceof Element) {
					// Add the classes to the root element.
					for (const ancestor of registryEntry.ancestors) {
						node.classList.add(ancestor.constructor.name);
					}
					this._setComponents(node);
					this._setRefs(node);
					this._setEventHandlersFromElemAttributes(node);
				}
			}
		}

		Component._addStyles(registryEntry);
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		// Destroy all child components.
		for (const component of this._components) {
			component.destroy();
		}

		// Remove this from its parent component.
		for (const node of this._rootNodes) {
			if (node.parentNode !== null) {
				node.parentNode.removeChild(node);
			}
		}

		// Remove the style elements of the component and its ancestors.
		Component._removeStyles(Component._registry.get(this.constructor.name.toLowerCase()));
	}

	/**
	 * Gets the element with the reference. Returns null if not found.
	 * @param {string} ref - The reference.
	 * @returns {Element}
	 */
	__getElement(ref) {
		return this._elementRefs.getValue(ref) || null;
	}

	/**
	 * Gets the component with the reference. Returns null if not found.
	 * @param {string} ref - The reference.
	 * @returns {Component}
	 */
	__getComponent(ref) {
		return this._componentRefs.getValue(ref) || null;
	}

	/**
	 * Sets the inner html for an referenced element. Cleans up tabs and newlines.
	 * Cleans up old handlers and components and adds new handlers and components.
	 * @param {string} ref - The reference to the element whose innerHTML is set.
	 * @param {string} html - The HTMl.
	 */
	__setHtml(ref, html) {
		const element = this._elementRefs.getValue(ref);
		if (!element) {
			throw new Error('Element with reference "' + ref + '" not found.');
		}
		html = html.replace(/[\t\n]+/g, '');
		for (const child of element.children) {
			this._unsetRefs(child);
		}
		this._unsetComponents(element);
		element.innerHTML = html;
		this._setComponents(element);
		for (const child of element.children) {
			this._setRefs(child);
		}
		this._setEventHandlersFromElemAttributes(element);
	}

	/**
	 * Unsets (removes) the referenced component. Does nothing if it isn't found.
	 * @param {string} ref - The reference to the component.
	 */
	__unsetComponent(ref) {
		const component = this._componentRefs.getValue(ref);
		if (component === undefined) {
			return;
		}
		this._componentRefs.delete(ref);
		this._components.delete(component);
		component.destroy();
	}

	/**
	 * Sets a new component as a child of *parent* right before the child *beforeChild*.
	 * @template {Component} T
	 * @param {ComponentType<T>} ComponentType
	 * @param {object} options
	 * @param {Element} options.parentElement
	 * @param {Node} [options.beforeChild]
	 * @param {string} [options.ref]
	 * @param {Object<string, string>} [options.attributes]
	 * @param {Node[]} [options.children]
	 * @returns {T}
	 */
	__setComponent(ComponentType, options) {
		// Create the component.
		const newComponent = new ComponentType(options.attributes, options.children);
		this._components.add(newComponent);

		// Connect the component to its parent.
		for (const rootNode of newComponent._rootNodes) {
			if (options.beforeChild !== undefined) {
				options.parentElement.insertBefore(rootNode, options.beforeChild);
			}
			else {
				options.parentElement.appendChild(rootNode);
			}
		}

		// Set the reference, if there is one.
		if (options.ref) {
			this._componentRefs.set(options.ref, newComponent);
		}
		return newComponent;
	}

	/**
	 * Gets the inputs from a form along with their values. Each key/value pair is an input's name and corresponding value.
	 * @param {Element} elem
	 * @returns {Object<string,string|boolean>}
	 */
	static getFormInputs(elem) {
		/** @type {Object<string,string|boolean>} */
		const result = {};
		for (const child of elem.children) {
			if (child instanceof HTMLInputElement
				|| child instanceof HTMLSelectElement
				|| child instanceof HTMLTextAreaElement) {
				if (child.hasAttribute('name')) {
					const name = child.getAttribute('name');
					if (child instanceof HTMLInputElement && child.getAttribute('type') === 'checkbox') {
						result[name] = child.checked;
					}
					else {
						result[name] = child.value;
					}
				}
			}
			Object.assign(result, this.getFormInputs(child));
		}
		return result;
	}

	/**
	 * Registers a component.
	 * @param {typeof Component} ComponentType
	 */
	static register(ComponentType) {
		/** @type {RegistryEntry} */
		const entry = {
			constructor: ComponentType,
			ancestors: [],
			html: ComponentType.html.trim().replace(/\n/g, '').replace(/\t/g, ''),
			style: ComponentType.style.trim(),
			styleElem: null,
			styleCount: 0
		};

		entry.ancestors.push(entry);

		// Populate the ancestors.
		let ancestor = ComponentType;
		while (true) {
			if (ancestor === Component) {
				break;
			}
			ancestor = Object.getPrototypeOf(ancestor);
			const ancestorEntry = Component._registry.get(ancestor.name.toLowerCase());
			entry.ancestors.push(ancestorEntry);
		}

		// Set the registry entry.
		this._registry.set(ComponentType.name.toLowerCase(), entry);
	}

	/**
	 * Unsets all of the components that are in the node.
	 * Used before setting new HTML.
	 * @param {Node} node
	 * @private
	 */
	_unsetComponents(node) {
		for (const component of this._components) {
			for (const rootNode of component._rootNodes) {
				if (node.contains(rootNode)) {
					this._componentRefs.delete(this._componentRefs.getKey(component));
					this._components.delete(component);
					component.destroy();
					break;
				}
			}
		}
	}

	/**
	 * Goes through all of the tags, and for any that match a component in the registry, sets it with the matching component.
	 * @param {Element} element
	 * @private
	 */
	_setComponents(element) {
		for (let i = 0; i < element.children.length; i++) {
			const child = element.children[i];
			const component = this._checkAndSetComponentFromElement(child);
			if (component === null) {
				this._setComponents(child);
			}
		}
	}

	/**
	 * If the element is a component tag, instantiate that component.
	 * @param {Element} element
	 * @returns {Component}
	 * @private
	 */
	_checkAndSetComponentFromElement(element) {
		const registryEntry = Component._registry.get(element.tagName.toLowerCase());
		if (registryEntry === undefined) {
			return null; // Not a component.
		}
		// Get the attributes.
		/** @type {Object<string, string>} */
		const attributes = {};
		for (const attribute of element.attributes) {
			attributes[attribute.name] = attribute.value;
		}
		// Get the reference id.
		const ref = attributes.ref;
		// Get the grandchildren.
		const children = [];
		for (const child of element.childNodes) {
			children.push(child);
			element.removeChild(child);
		}
		return this.__setComponent(registryEntry.constructor, {
			ref: ref,
			attributes: attributes,
			children: children,
			parentElement: element.parentElement,
			beforeChild: element
		});
	}

	/**
	 * Sets the refs for the node and its children.
	 * @param {Element} element
	 * @private
	 */
	_setRefs(element) {
		if (element.classList.contains('Component') && !this._rootNodes.includes(element)) {
			return; // Don't process child components.
		}
		const attribute = element.attributes.getNamedItem('ref');
		if (attribute !== null) {
			if (this._elementRefs.hasKey(attribute.value)) {
				throw new Error('The element ref "' + attribute.value + '" has already been used.');
			}
			this._elementRefs.set(attribute.value, element);
		}
		for (const child of element.children) {
			this._setRefs(child);
		}
	}

	/**
	 * Unsets the refs for the node and its children.
	 * @param {Element} element
	 * @private
	 */
	_unsetRefs(element) {
		if (element.classList.contains('Component') && !this._rootNodes.includes(element)) {
			return; // Don't process child components.
		}
		const attribute = element.attributes.getNamedItem('ref');
		if (attribute !== null) {
			this._elementRefs.delete(attribute.value);
		}
		for (const child of element.children) {
			this._unsetRefs(child);
		}
	}

	/**
	 * Sets the event handlers for all children of elem. Searches for all attributes starting with 'on' and processes them.
	 * @param {Element} element
	 * @private
	 */
	_setEventHandlersFromElemAttributes(element) {
		const attributeNamesToRemove = [];
		for (const attribute of element.attributes) {
			if (attribute.name.startsWith('on')) {
				// Get the event type without the 'on'.
				const event = attribute.name.substring(2).toLowerCase();
				// Get the callback.
				const handler = this[attribute.value];
				if (handler === undefined || !(handler instanceof Function)) {
					throw new Error('Could not find ' + event + ' handler ' + attribute.value + ' for element with id ' + element.id);
				}
				// Get the callback bound to this.
				const boundHandler = handler.bind(this, element);
				// Remove the attribute so there's no conflict.
				attributeNamesToRemove.push(attribute.name);
				// Add the event listener.
				element.addEventListener(event, boundHandler);
			}
		}
		for (const attributeName of attributeNamesToRemove) {
			element.removeAttribute(attributeName);
		}
		for (const child of element.children) {
			this._setEventHandlersFromElemAttributes(child);
		}
	}

	/**
	 * Adds the style of every component and all of its ancestors (up to and including Component), if it is not already added.
	 * @param {RegistryEntry} registryEntry
	 * @private
	 */
	static _addStyles(registryEntry) {
		let lastStyleElem = null;
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			const ancestor = registryEntry.ancestors[i];

			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = this._registry.get(ancestor.constructor.name.toLowerCase());
			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (ancestorEntry.style !== '') {
				if (ancestorEntry.styleCount === 0) {
					ancestorEntry.styleElem = document.createElement('style');
					ancestorEntry.styleElem.id = ancestorEntry.constructor.name;
					ancestorEntry.styleElem.innerHTML = ancestorEntry.style;
					document.head.insertBefore(ancestorEntry.styleElem, lastStyleElem);
				}
				ancestorEntry.styleCount += 1;
				lastStyleElem = ancestorEntry.styleElem;
			}
		}
	}

	/**
	 * Removes the style element of the component and all of its ancestors (up to and including Component), if it is the only one left.
	 * @param {RegistryEntry} registryEntry
	 * @private
	 */
	static _removeStyles(registryEntry) {
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			const ancestor = registryEntry.ancestors[i];

			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = this._registry.get(ancestor.constructor.name.toLowerCase());
			if (ancestorEntry.styleElem !== null) {
				ancestorEntry.styleCount -= 1;
				if (ancestorEntry.styleCount === 0) {
					document.head.removeChild(ancestorEntry.styleElem);
					ancestorEntry.styleElem = null;
				}
			}
		}
	}
}

Component.html = '';
Component.style = '';

/**
 * @typedef RegistryEntry
 * @property {ComponentType<Component>} constructor
 * @property {RegistryEntry[]} ancestors
 * @property {string} html
 * @property {string} style
 * @property {HTMLStyleElement} styleElem
 * @property {number} styleCount
 */

/**
 * The registered components, mapped from string to Component type.
 * @type {Map<string, RegistryEntry>}
 * @private
 */
Component._registry = new Map();

Component.register(Component);
