/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	constructor() {
		// Make sure the component is registered.
		let registryEntry = Component._registry.get(this.constructor.name);
		if (registryEntry === undefined) {
			registryEntry = Component.register(Object.getPrototypeOf(this).constructor);
		}

		/**
		 * The root elements.
		 * @type {Node[]}
		 */
		this._rootNodes = [];

		/**
		 * The set of child components.
		 * @type {Set<Component>}
		 */
		this._components = new Set();

		/**
		 * The mapping of references to elements.
		 * @type {Map<string, Element>}
		 */
		this._elementRefs = new Map();

		// Set the HTML of the root element.
		if (registryEntry.html !== '') {
			// Create the template and add the html content as the root node.
			const templateElem = document.createElement('template');
			templateElem.innerHTML = registryEntry.html;
			this._rootNodes = [...templateElem.content.cloneNode(true).childNodes];

			// Set the event handlers and child components.
			for (const node of this._rootNodes) {
				if (node instanceof Element) {
					// Set the references.
					this._setRefs(node);

					// Set the event handlers.
					this._setEventHandlersFromElemAttributes(node);

					// Add the classes to the root element.
					for (const ancestorEntry of registryEntry.ancestorEntries) {
						node.classList.add(ancestorEntry.constructor.name);
					}
				}
			}
		}

		// Set the style element.
		let lastStyleElem = null;
		for (let i = 0; i < registryEntry.ancestorEntries.length; i++) {
			const ancestorEntry = registryEntry.ancestorEntries[i];

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (ancestorEntry.css !== '') {
				if (ancestorEntry.styleCount === 0) {
					ancestorEntry.styleElem = document.createElement('style');
					ancestorEntry.styleElem.id = ancestorEntry.constructor.name;
					ancestorEntry.styleElem.innerHTML = ancestorEntry.css;
					document.head.insertBefore(ancestorEntry.styleElem, lastStyleElem);
				}
				ancestorEntry.styleCount += 1;
				lastStyleElem = ancestorEntry.styleElem;
			}
		}
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	__destroy() {
		// Destroy all child components.
		for (const component of this._components) {
			component.__destroy();
		}

		// Remove the style elements of the component and its ancestors.
		const registryEntry = Component._registry.get(this.constructor.name);
		for (let i = 0; i < registryEntry.ancestorEntries.length; i++) {
			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = registryEntry.ancestorEntries[i];
			if (ancestorEntry.styleElem !== null) {
				ancestorEntry.styleCount -= 1;
				if (ancestorEntry.styleCount === 0) {
					document.head.removeChild(ancestorEntry.styleElem);
					ancestorEntry.styleElem = null;
				}
			}
		}
	}

	/**
	 * Gets the element with the reference. Returns null if not found.
	 * @param {string} ref - The reference.
	 * @returns {Element}
	 */
	__element(ref) {
		return this._elementRefs.get(ref) || null;
	}

	/**
	 * Sets the inner html for an referenced element. Cleans up tabs and newlines.
	 * Cleans up old handlers and components and adds new handlers and components.
	 * @param {Element} element - The element.
	 * @param {string} html - The HTMl.
	 */
	__setHtml(element, html) {
		html = html.replace(/[\t\n]+/g, '');
		for (const child of element.children) {
			this._unsetRefs(child);
			this._unsetComponents(child);
		}
		element.innerHTML = html;
		for (const child of element.children) {
			if (child instanceof HTMLElement) {
				this._setRefs(child);
				this._setEventHandlersFromElemAttributes(child);
			}
		}
	}

	/**
	 * Sets a new component as a child of *parent* right before the child *beforeChild*.
	 * @template {Component} T
	 * @param {Node} parentNode
	 * @param {Node} beforeChild
	 * @param {new (...params:any) => T} ComponentType
	 * @param {...any} params
	 * @returns {T}
	 */
	__insertComponent(parentNode, beforeChild, ComponentType, ...params) {
		// Create the component.
		const newComponent = new ComponentType(...params);

		// Add it to the list of components.
		this._components.add(newComponent);

		// Connect the component to its parent.
		for (const rootNode of newComponent._rootNodes) {
			if (beforeChild !== null) {
				parentNode.insertBefore(rootNode, beforeChild);
			}
			else {
				parentNode.appendChild(rootNode);
			}
		}

		return newComponent;
	}

	/**
	 * Deletes the referenced component. Does nothing if it isn't found.
	 * @param {Component} component
	 */
	__deleteComponent(component) {
		if (!this._components.has(component)) {
			return;
		}
		// Delete the component from the lists.
		this._components.delete(component);

		// Remove the component's root nodes.
		for (const node of component._rootNodes) {
			node.parentNode.removeChild(node);
		}

		// Call its destroy function.
		component.__destroy();
	}

	/**
	 * Adds an event listener to an element.
	 * @param {string} ref
	 * @param {string} event
	 * @param {(event:Event, ...params:any) => void} callback
	 * @param {...any} params
	 */
	__on(ref, event, callback, ...params) {
		const element = this.__element(ref);
		if (element === null) {
			console.trace();
			throw new Error('The reference "' + ref + '" is invalid.');
		}
		element.addEventListener(event, callback.bind(this, ...params));
	}

	/**
	 * Sets the refs for the node and its children.
	 * @param {Element} element
	 */
	_setRefs(element) {
		if (element.classList.contains('Component')) {
			return; // Don't process child components.
		}
		const attribute = element.attributes.getNamedItem('ref');
		if (attribute !== null) {
			if (this._elementRefs.has(attribute.value)) {
				throw new Error('The element ref "' + attribute.value + '" has already been used.');
			}
			this._elementRefs.set(attribute.value, element);
		}
		for (const child of element.children) {
			if (child instanceof HTMLElement) {
				this._setRefs(child);
			}
		}
	}

	/**
	 * Unsets the refs for the node and its children.
	 * @param {Element} element
	 */
	_unsetRefs(element) {
		if (element.classList.contains('Component')) {
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
	 * Unsets all of the components that are in the node.
	 * Used before setting new HTML.
	 * @param {Node} node
	 */
	_unsetComponents(node) {
		for (const component of this._components) {
			for (const rootNode of component._rootNodes) {
				if (node === rootNode || node.contains(rootNode)) {
					this.__deleteComponent(component);
					break;
				}
			}
		}
	}

	/**
	 * Sets the event handlers for all children of elem. Searches for all attributes starting with 'on' and processes them.
	 * @param {Element} element
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
				const boundHandler = handler.bind(this);
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
	 * @returns {Component.RegistryEntry} registryEntry
	 */
	static register(ComponentType) {
		/** @type {Component.RegistryEntry} */
		const entry = new Component.RegistryEntry(ComponentType);

		// Set the registry entry.
		this._registry.set(ComponentType.name, entry);

		return entry;
	}
}

Component.RegistryEntry = class {
	/**
	 * @param {typeof Component} ComponentType
	 */
	constructor(ComponentType) {
		/**
		 * The constructor.
		 * @type {typeof Component}
		 */
		this.constructor = ComponentType;

		/**
		 * The ancestor registry entries, including ComponentType and Component.
		 * @type {Component.RegistryEntry[]}
		 */
		this.ancestorEntries = [];

		/**
		 * The HTML for the ComponentType.
		 * @type {string}
		 */
		this.html = ComponentType.html ? ComponentType.html.replace(/[\t\n]+/g, '').trim() : '';

		/**
		 * The CSS for the ComponentType.
		 * @type {string}
		 */
		this.css = ComponentType.css ? ComponentType.css.trim() : '';

		/**
		 * The style element.
		 * @type {HTMLStyleElement}
		 */
		this.styleElem = null;

		/**
		 * The number of components using this style. Includes ComponentType and all its descendants.
		 * @type {number}
		 */
		this.styleCount = 0;

		// Get the ancestors.
		const ancestors = [];
		let ancestor = ComponentType;
		while (true) {
			ancestors.unshift(ancestor);
			if (ancestor === Component) {
				break;
			}
			ancestor = Object.getPrototypeOf(ancestor);
		}

		// Populate the ancestor entries.
		for (let i = 0; i < ancestors.length; i++) {
			const ancestor = ancestors[i];
			if (ancestor !== ComponentType) {
				let ancestorEntry = Component._registry.get(ancestor.name);
				if (ancestorEntry === undefined) {
					ancestorEntry = Component.register(ancestor);
				}
				this.ancestorEntries.push(ancestorEntry);
			}
			else {
				this.ancestorEntries.push(this);
			}
		}
	}
};

Component.html = '';
Component.css = '';

/**
 * The registered components, mapped from string to Component type.
 * @type {Map<string, Component.RegistryEntry>}
 */
Component._registry = new Map();
