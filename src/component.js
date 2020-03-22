/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	/**
	 * Constructs a component.
	 * @param {Component.Params} params
	 */
	constructor(params) {
		// Make sure the component is registered.
		let registryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		if (registryEntry === undefined) {
			throw new Error('The component "' + this.constructor.name + '" has not been registered.');
		}

		/**
		 * The reference of the component.
		 * @type {string}
		 */
		this._ref = params.ref;

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

		/**
		 * The mapping of references to child components.
		 * @type {Map<string, Component>}
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

		// If there is a ref element called content, this is where the content goes.
		if (this._elementRefs.has('content')) {
			const contentElement = this._elementRefs.get('content');
			this.__setHtml(contentElement, '');
			for (const child of params.children) {
				contentElement.appendChild(child);
			}
			this._setRefs(contentElement);
			this._setComponents(contentElement);
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
				this._setComponents(child);
				this._setRefs(child);
				this._setEventHandlersFromElemAttributes(child);
			}
		}
	}

	/**
	 * Sets a new component as a child of *parent* right before the child *beforeChild*.
	 * @template {Component} T
	 * @param {new (params:Component.Params) => T} ComponentType
	 * @param {Node} parentNode
	 * @param {Node} beforeChild
	 * @param {Component.Params} params
	 * @returns {T}
	 */
	__insertComponent(ComponentType, parentNode, beforeChild, params) {
		// Create the component.
		const newComponent = new ComponentType(params);

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

		// Set the reference, if there is one.
		if (params.ref !== '') {
			this._componentRefs.set(params.ref, newComponent);
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
	 * Goes through all of the tags, and for any that match a component in the registry, sets it with the matching component.
	 * Goes through all of the children also.
	 * @param {Element} element
	 */
	_setComponents(element) {
		const registryEntry = Component._registry.get(element.tagName.toLowerCase());
		if (registryEntry !== undefined) {
			const params = new Component.Params();
			// Get the reference id.
			params.ref = params.attributes.get('ref') || '';
			// Get the attributes.
			for (const attribute of element.attributes) {
				let value = attribute.value;
				if (value.startsWith('{{') && value.endsWith('}}')) {
					value = attribute.value.substring(2, attribute.value.length - 2);
					if (this[value] instanceof Function) {
						value = this[value].bind(this);
					}
					else {
						value = this[value];
					}
				}
				params.attributes.set(attribute.name, value);
			}
			// Get the grandchildren.
			for (const child of element.childNodes) {
				params.children.push(child);
				element.removeChild(child);
			}
			const component = this.__insertComponent(registryEntry.constructor, element.parentNode, element, params);
			element.parentNode.removeChild(element);
			return component;
		}
		else {
			for (const child of element.children) {
				this._setComponents(child);
			}
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
	 */
	static register() {
		if (this._registry.has(this.name.toLowerCase())) {
			throw new Error('A component named "' + this.name + '" is already registered.');
		}

		/** @type {Component.RegistryEntry} */
		const entry = new Component.RegistryEntry(this);

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

Component.Params = class {
	constructor() {
		/**
		 * The reference of the component, if it has one.
		 * @type {string}
		 */
		this.ref = '';

		/**
		 * The attributes passed as if it were <Component attrib=''...>.
		 * @type {Map<string, any>}
		 */
		this.attributes = new Map();

		/**
		 * The children of the node as if it were <Component><child1/>...</Component>.
		 * @type {Node[]}
		 */
		this.children = [];
	}
};

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
		this.ancestors = [];

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
	}
};

Component.html = '';
Component.css = '';

/**
 * The registered components, mapped from string to Component type.
 * @type {Map<string, Component.RegistryEntry>}
 */
Component._registry = new Map();

Component.register();
