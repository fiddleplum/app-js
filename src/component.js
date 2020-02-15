import State from './state';

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	/**
	 * Registers a component.
	 * @param {typeof Component} ComponentType
	 */
	static register(ComponentType) {
		this._registry.set(ComponentType.name.toLowerCase(), {
			ComponentType,
			styleElem: null,
			useCount: 0
		});
	}

	/**
	 * Constructs a component.
	 * @param {Element} elem - The element inside which thee the component will reside.
	 */
	constructor(elem) {
		// Make sure the component is registered.
		const componentRegistryEntry = Component._registry.get(this.constructor.name.toLowerCase());
		if (componentRegistryEntry === undefined) {
			throw new Error('The component ' + this.constructor.name + ' has not been registered.');
		}

		// Make sure the elem is an HTMLElement.
		if (!(elem instanceof HTMLElement)) {
			throw new Error('No or invalid element was specified in which to create the ' + this.constructor.name);
		}

		/**
		 * The HTML element that this component is inside.
		 * @type {HTMLElement}
		 * @private
		 */
		this._rootElem = elem;

		/**
		 * The state of the component.
		 * @type {State}
		 * @private
		 */
		this._htmlVariables = new State();

		/**
		 * A mapping to keep track of how many of each text variable exist.
		 * @type {Map<string, number>}
		 * @private
		 */
		this._htmlVariableCounts = new Map();

		/**
		 * The mapping of elemIds to components.
		 * @type {Map<string, Component>}
		 * @private
		 */
		this._components = new Map();

		// Add the CSS classes and styles.
		this._addClassesAndStyles(componentRegistryEntry);

		// Set the html.
		this.setHtml(this._rootElem, this.constructor.html || '');
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		for (const component of this._components.values()) {
			component.destroy();
		}

		// Clear out any html from the parent element.
		this._rootElem.innerHTML = '';

		this._removeClassesAndStyles();
	}

	/**
	 * Returns the HTML element that this uses.
	 * @returns {HTMLElement}
	 */
	get rootElem() {
		return this._rootElem;
	}

	/**
	 * Gets the element with the id. If id is undefined, it returns the root. If it is not found, it returns null.
	 * @param {string} id
	 * @returns {Element}
	 */
	elem(id) {
		return this._rootElem.querySelector('#' + id);
	}

	/**
	 * Gets the inputs from a form along with their values. Each key/value pair is an input's name and corresponding value.
	 * @param {string|Element} idOrElem
	 * @returns {Object<string,string|boolean>}
	 */
	getFormInputs(idOrElem) {
		const elem = typeof idOrElem === 'string' ? this._rootElem.querySelector('#' + idOrElem) : idOrElem;
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
	 * Sets an event listener on the element with the id.
	 * @param {string|Element} idOrElem - The id of the element or the element itself.
	 * @param {string} event
	 * @param {(event:Event) => {}} listener
	 */
	on(idOrElem, event, listener) {
		let elem = typeof idOrElem === 'string' ? this._rootElem.querySelector('#' + idOrElem) : idOrElem;
		elem.addEventListener(event, listener.bind(this));
	}

	/**
	 * Sets a render variable.
	 * @param {string} name
	 * @param {string} value
	 */
	setHtmlVariable(name, value) {
		this._htmlVariables.set(name, value);
	}

	/**
	 * Creates an element.
	 * @param {string} tag
	 * @param {string} id
	 * @param {string|string[]} classNames
	 * @param {string} html
	 * @param {Object<string, EventListener>} eventListeners
	 */
	createElement(tag, id, classNames, html, eventListeners) {
		const elem = document.createElement(tag);
		if (id !== '') {
			elem.id = id;
		}
		if (typeof classNames === 'string' && classNames !== '') {
			elem.classList.add(classNames);
		}
		else if (Array.isArray(classNames)) {
			for (let i = 0; i < classNames.length; i++) {
				elem.classList.add(classNames[i]);
			}
		}
		if (html !== '') {
			elem.innerHTML = html;
		}
		for (const type of Object.keys(eventListeners)) {
			elem.addEventListener(type, eventListeners[type].bind(this));
		}
		return elem;
	}

	/**
	 * Sets the html for an element.
	 * @param {string|Element} idOrElem - The id of the element or the element itself.
	 * @param {string} html
	 */
	setHtml(idOrElem, html) {
		const elem = typeof idOrElem === 'string' ? this._rootElem.querySelector('#' + idOrElem) : idOrElem;
		this._unsetHtmlVariables(elem);
		html = html.replace(/[\t\n]+/g, '');
		elem.innerHTML = this._setHtmlVariables(html);
		this._setEventHandlersFromAttributes(elem);
		this._setComponents(elem);
	}

	/**
	 * Gets the component at the element with the id of *elemId*. Returns undefined if there is no component at the element.
	 * @param {string} elemId
	 * @returns {Component}
	 */
	getComponent(elemId) {
		return this._components.get(elemId);
	}

	/**
	 * Unsets (removes) the component at the element with the id of *elemId*. Does nothing if there is no component at that element.
	 * @param {string} elemId
	 */
	unsetComponent(elemId) {
		const component = this._components.get(elemId);
		if (component) {
			component.destroy();
			this._components.delete(elemId);
		}
	}

	/**
	 * Sets a new component at the element with the id of *elemId*. If there is already a component at that element, the component is first removed.
	 * @template {Component} ComponentType
	 * @param {string|Element} idOrElem - The id of the element or the element itself.
	 * @param {new (elem:Element) => ComponentType} ComponentClass
	 * @returns {ComponentType}
	 */
	setComponent(idOrElem, ComponentClass) {
		const elem = typeof idOrElem === 'string' ? this._rootElem.querySelector('#' + idOrElem) : idOrElem;
		const component = this._components.get(elem.id);
		if (component) {
			component.destroy();
			this._components.delete(elem.id);
		}
		const newComponent = new ComponentClass(elem);
		this._components.set(elem.id, newComponent);
		return newComponent;
	}

	/**
	 * Goes through all of the tags, and for any that match a component in the registry, sets it with the matching component.
	 * @param {Element} elem
	 * @private
	 */
	_setComponents(elem) {
		for (let i = 0; i < elem.children.length; i++) {
			const child = elem.children[i];
			const componentRegistryEntry = Component._registry.get(child.tagName.toLowerCase());
			if (componentRegistryEntry !== undefined) {
				const newDiv = document.createElement('div');
				for (const attribute of child.attributes) {
					newDiv.setAttribute(attribute.name, attribute.value);
				}
				elem.replaceChild(newDiv, child);
				const newComponent = new componentRegistryEntry.ComponentType(newDiv);
				if (newDiv.id !== '' && newDiv.id !== undefined) {
					this._components.set(newDiv.id, newComponent);
				}
			}
			else {
				this._setComponents(child);
			}
		}
	}

	/**
	 * Adds to the CSS class list the JavaScript class name of object and all of its ancestors (up to and excluding Component).
	 * Adds the style of every component and all of its ancestors (up to and excluding Component), if it is not already added.
	 * @param {ComponentRegistryEntry} componentRegistryEntry
	 */
	_addClassesAndStyles(componentRegistryEntry) {
		// Go through each of the component's ancestors,
		/** @type {Component} */
		let thisAncestor = Object.getPrototypeOf(this);
		let lastStyleElem = null;
		while (thisAncestor.constructor !== Component) {
			// Add the ancestor's name to the class list.
			this._rootElem.classList.add(thisAncestor.constructor.name);

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			const entry = Component._registry.get(thisAncestor.constructor.name.toLowerCase());
			if (thisAncestor.constructor.style !== '') {
				if (entry.useCount === 0) {
					entry.styleElem = document.createElement('style');
					entry.styleElem.id = thisAncestor.constructor.name;
					entry.styleElem.innerHTML = thisAncestor.constructor.style;
					document.head.insertBefore(entry.styleElem, lastStyleElem);
				}
				lastStyleElem = entry.styleElem;
			}
			entry.useCount += 1;
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}
	}

	/**
	 * Removes from the CSS class list the JavaScript class name of object and all of its ancestors (up to and excluding Component).
	 * Removes the style of every component and all of its ancestors (up to and excluding Component), if it is the only one left.
	 */
	_removeClassesAndStyles() {
		// Go through each of the component's ancestors,
		/** @type {Component} */
		let thisAncestor = Object.getPrototypeOf(this);
		while (thisAncestor.constructor !== Component) {
			// Remove the ancestor's name from the class list.
			this._rootElem.classList.remove(thisAncestor.constructor.name);

			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			const entry = Component._registry.get(thisAncestor.constructor.name.toLowerCase());
			entry.useCount -= 1;
			if (entry.styleElem !== null) {
				if (entry.useCount === 0) {
					document.head.removeChild(entry.styleElem);
				}
				entry.styleElem = null;
			}
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}
	}

	/**
	 * Unsets the text variables, removing any listeners that are no longer used.
	 * @param {Element} elem
	 * @private
	 */
	_unsetHtmlVariables(elem) {
		for (const [name] of this._htmlVariableCounts) {
			const spanElems = elem.querySelectorAll('span#var_' + name);
			this._htmlVariableCounts.set(name, this._htmlVariableCounts.get(name) - spanElems.length);
			if (this._htmlVariableCounts.get(name) === 0) {
				this._htmlVariables.remove(name);
			}
		}
	}

	/**
	 * Sets text variables for the HTML. Searches for all text that includes {*} and processes them, returning the processed HTML.
	 * @param {string} html
	 * @returns {string}
	 * @private
	 */
	_setHtmlVariables(html) {
		const searchRegExp = /{{([a-zA-Z_][a-zA-Z0-9_]+(\[[0-9]+\])?)}}/g;
		while (true) {
			const match = searchRegExp.exec(html);
			if (match === null) {
				break;
			}
			const name = match[1];
			html = html.substr(0, match.index) + '<span id="var_' + name + '"></span>' + html.substr(searchRegExp.lastIndex);
			if (this._htmlVariableCounts.has(name)) {
				this._htmlVariableCounts.set(name, this._htmlVariableCounts.get(name) + 1);
			}
			else {
				this._htmlVariables.addListener(name, (name, oldValue, newValue) => {
					const spanElems = this._rootElem.querySelectorAll('span#var_' + name);
					for (const spanElem of spanElems) {
						spanElem.innerHTML = newValue;
					}
				});
				this._htmlVariableCounts.set(name, 1);
			}
		}
		return html;
	}

	/**
	 * Sets the event handlers for all children of elem. Searches for all attributes starting with 'on' and processes them.
	 * @param {Element} elem
	 * @private
	 */
	_setEventHandlersFromAttributes(elem) {
		for (const child of elem.children) {
			const attributeNamesToRemove = [];
			for (const attribute of child.attributes) {
				if (attribute.name.startsWith('on')) {
					// Get the event type without the 'on'.
					const event = attribute.name.substring(2).toLowerCase();
					// Get the callback.
					const handler = this[attribute.value];
					if (handler === undefined || !(handler instanceof Function)) {
						throw new Error('Could not find ' + event + ' handler ' + attribute.value + ' for element with id ' + elem.id);
					}
					// Get the callback bound to this.
					const boundHandler = handler.bind(this);
					// Remove the attribute so there's no conflict.
					attributeNamesToRemove.push(attribute.name);
					// Add the event listener.
					child.addEventListener(event, boundHandler);
				}
			}
			for (const attributeName of attributeNamesToRemove) {
				child.removeAttribute(attributeName);
			}
			this._setEventHandlersFromAttributes(child);
		}
	}
}

/**
 * @typedef ComponentRegistryEntry
 * @property {typeof Component} ComponentType
 * @property {HTMLStyleElement} styleElem
 * @property {number} useCount
 */

/**
 * The registered components, mapped from string to Component type.
 * @type {Map<string, ComponentRegistryEntry>}
 * @private
 */
Component._registry = new Map();
