/**
 * @template {Component} T
 * @typedef {new (ref:string, attributes:Object<string, any>, children:Node[]) => T} ComponentType
 */

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	/**
	 * Constructs a component.
	 * @param {string} ref - The reference of the component, if it has one.
	 * @param {Object<string, any>} attributes - The attributes passed as if it were <Component attrib=''...>
	 * @param {Node[]} children - The children of the node as if it were <Component><child1/>...</Component>
	 */
	constructor(ref, attributes, children) {
		// Make sure the component is registered.
		let registryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		if (registryEntry === undefined) {
			throw new Error('The component "' + this.constructor.name + '" has not been registered.');
		}

		/**
		 * The reference of the component.
		 * @type {string}
		 * @private
		 */
		this._ref = ref;

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
		 * @type {Map<string, Element>}
		 * @private
		 */
		this._elementRefs = new Map();

		/**
		 * The mapping of references to child components.
		 * @type {Map<string, Component>}
		 * @private
		 */
		this._componentRefs = new Map();

		// Set the HTML of the root element.
		if (registryEntry.html !== '') {
			// Create the template and add the html content as the root node.
			const templateElem = document.createElement('template');
			templateElem.innerHTML = registryEntry.html;
			this._rootNodes = [...templateElem.content.cloneNode(true).childNodes];

			// Set the event handlers and child components.
			for (const node of this._rootNodes) {
				if (node instanceof Element) {
					// Set the child components.
					this._setComponents(node);

					// Set the references.
					this._setRefs(node);

					// Set the event handlers.
					this._setEventHandlersFromElemAttributes(node);

					// Add the classes to the root element.
					for (const ancestor of registryEntry.ancestors) {
						node.classList.add(ancestor.constructor.name);
					}
				}
			}
		}

		// Set the style element.
		let lastStyleElem = null;
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			const ancestorEntry = registryEntry.ancestors[i];

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
		const registryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		for (let i = 0; i < registryEntry.ancestors.length; i++) {
			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const ancestorEntry = registryEntry.ancestors[i];
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
	 * Gets the component with the reference. Returns null if not found.
	 * @param {string} ref - The reference.
	 * @returns {Component}
	 */
	__component(ref) {
		return this._componentRefs.get(ref) || null;
	}

	/**
	 * Sets the inner html for an referenced element. Cleans up tabs and newlines.
	 * Cleans up old handlers and components and adds new handlers and components.
	 * @param {HTMLElement} element - The element.
	 * @param {string} html - The HTMl.
	 */
	__setHtml(element, html) {
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
	 * Sets a new component as a child of *parent* right before the child *beforeChild*.
	 * @template {Component} T
	 * @param {ComponentType<T>} ComponentType
	 * @param {Element} parentElement
	 * @param {Node} beforeChild
	 * @param {string} ref
	 * @param {Map<string, any>} attributes
	 * @param {Node[]} children
	 * @returns {T}
	 */
	__insertComponent(ComponentType, parentElement, beforeChild, ref, attributes, children) {
		// Create the component.
		const newComponent = new ComponentType(ref, attributes, children);

		// Add it to the list of components.
		this._components.add(newComponent);

		// Connect the component to its parent.
		for (const rootNode of newComponent._rootNodes) {
			if (beforeChild !== null) {
				parentElement.insertBefore(rootNode, beforeChild);
			}
			else {
				parentElement.appendChild(rootNode);
			}
		}

		// Set the reference, if there is one.
		if (ref !== '') {
			this._componentRefs.set(ref, newComponent);
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
		if (component._ref !== '') {
			this._componentRefs.delete(component._ref);
		}
		this._components.delete(component);

		// Remove the component's root nodes.
		for (const node of component._rootNodes) {
			node.parentNode.removeChild(node);
		}

		// Call its destroy function.
		component.__destroy();
	}

	/**
	 * Goes through all of the tags, and for any that match a component in the registry, sets it with the matching component.
	 * Goes through all of the children also.
	 * @param {Element} element
	 * @private
	 */
	_setComponents(element) {
		const registryEntry = Component._registry.get(element.tagName.toLowerCase());
		if (registryEntry !== undefined) {
			const child = element.children[i];
			const component = this._checkAndSetComponentFromElement(child);
		}
		else {
			for (let i = 0; i < element.children.length; i++) {
				if (component === null) {
					this._setComponents(child);
				}
			}
		}
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
			this._setRefs(child);
		}
	}

	/**
	 * Unsets the refs for the node and its children.
	 * @param {Element} element
	 * @private
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
	 */
	static register() {
		if (this._registry.has(this.name.toLowerCase())) {
			throw new Error('A component named "' + this.name + '" is already registered.');
		}

		/** @type {RegistryEntry} */
		const entry = {
			constructor: this,
			ancestors: [],
			html: this.html ? this.html.trim().replace(/\n/g, '').replace(/\t/g, '') : '',
			css: this.css ? this.css.trim() : '',
			styleElem: null,
			styleCount: 0
		};

		entry.ancestors.push(entry);

		// Populate the ancestors.
		let ancestor = this;
		while (true) {
			if (ancestor === Component) {
				break;
			}
			ancestor = Object.getPrototypeOf(ancestor);
			const ancestorEntry = Component._registry.get(ancestor.name.toLowerCase());
			entry.ancestors.push(ancestorEntry);
		}

		// Set the registry entry.
		this._registry.set(this.name.toLowerCase(), entry);
	}
}

Component.html = '';
Component.css = '';

/**
 * @typedef RegistryEntry
 * @property {typeof Component} constructor
 * @property {RegistryEntry[]} ancestors
 * @property {string} html
 * @property {string} css
 * @property {HTMLStyleElement} styleElem
 * @property {number} styleCount
 */

/**
 * The registered components, mapped from string to Component type.
 * @type {Map<string, RegistryEntry>}
 * @private
 */
Component._registry = new Map();

Component.register();
