import State from './state';

/**
 * A base component from which other components can extend.
 * Each subclass can have an `html` and a `style` property to add style to the components.
 * Only the most derived subclass's `html` property will be used.
 */
export default class Component {
	/**
	 * Constructs a component.
	 * @param {HTMLElement} elem - The element inside which thee the component will reside.
	 */
	constructor(elem) {
		if (elem === undefined) {
			throw new Error('No element was specified in which to create the ' + this.constructor.name);
		}

		/**
		 * The HTML element that this component is inside.
		 * @type {HTMLElement}
		 * @private
		 */
		this._elem = elem;

		/**
		 * The state of the component.
		 * @type {State}
		 * @private
		 */
		this._renderState = new State();

		// Go through each of the component's ancestors,
		let thisAncestor = Object.getPrototypeOf(this);
		let lastStyleElem = null;
		while (thisAncestor.constructor !== Component) {
			// Add the ancestor's name to the class list.
			this._elem.classList.add(thisAncestor.constructor.name);

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (thisAncestor.constructor.hasOwnProperty('style')) {
				let styleElem = document.querySelector('head style#' + thisAncestor.constructor.name);
				if (styleElem === null) {
					styleElem = document.createElement('style');
					styleElem.id = thisAncestor.constructor.name;
					styleElem.useCount = 0;
					styleElem.innerHTML = thisAncestor.constructor.style;
					document.head.insertBefore(styleElem, lastStyleElem);
				}
				styleElem.useCount += 1;
				lastStyleElem = styleElem;
			}
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}

		// Setup the rendered variables.
		/** @type {string} */
		let processedHTML = this.constructor.html || '';
		const searchRegExp = /{{([a-zA-Z_][a-zA-Z0-9_]+(\[[0-9]+\])?)}}/g;
		let match;
		while ((match = searchRegExp.exec(processedHTML)) !== null) {
			const name = match[1];
			processedHTML = processedHTML.substr(0, match.index) + '<span id="var_' + name + '"></span>' + processedHTML.substr(searchRegExp.lastIndex);
			this._renderState.addListener(name, (name, oldValue, newValue) => {
				const spanElems = this.elem.querySelectorAll('span#var_' + name);
				for (const spanElem of spanElems) {
					spanElem.innerHTML = newValue;
				}
			});
		}

		// Set the html.
		this._elem.innerHTML = processedHTML;
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		// Clear out any html from the parent element.
		this._elem.innerHTML = '';

		// Go through each of the component's ancestors,
		let thisAncestor = Object.getPrototypeOf(this);
		while (thisAncestor.constructor !== Component) {
			// Remove the ancestor's name from the class list.
			this._elem.classList.remove(thisAncestor.constructor.name);

			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			if (thisAncestor.constructor.style !== undefined) {
				let styleElem = document.querySelector('head style#' + thisAncestor.constructor.name);
				if (styleElem) {
					styleElem.useCount -= 1;
					if (styleElem.useCount === 0) {
						document.head.removeChild(styleElem);
					}
				}
			}
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}
	}

	/**
	 * Returns the HTML element that this uses.
	 * @returns {HTMLElement}
	 */
	get elem() {
		return this._elem;
	}

	/**
	 * Sets an event listener on the element with the id.
	 * @param {string} id
	 * @param {string} event
	 * @param {(event:Event) => {}} listener
	 */
	on(id, event, listener) {
		this._elem.querySelector('#' + id).addEventListener(event, listener.bind(this));
	}

	/**
	 * Sets a render variable.
	 * @param {string} name
	 * @param {string} value
	 */
	setRenderState(name, value) {
		this._renderState.set(name, value);
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
	 * Gets the element with the id. If id is undefined, it returns the root.
	 * @param {string} id
	 * @returns {HTMLElement}
	 */
	get(id) {
		if (id !== undefined) {
			return this._elem.querySelector('#' + id);
		}
		else {
			return this._elem;
		}
	}

	/**
	 * Sets the class for an element.
	 * @param {string} id - id of the element.
	 * @param {string} className - class to set.
	 * @param {boolean} enabled - set if true, unset if false.
	 */
	setClass(id, className, enabled) {
		const elem = this._elem.querySelector('#' + id);
		if (enabled) {
			elem.classList.add(className);
		}
		else {
			elem.classList.remove(className);
		}
	}

	/**
	 * Sets the html for an element.
	 * @param {string} id
	 * @param {string} html
	 */
	setSetHtml(id, html) {
		const elem = this._elem.querySelector('#' + id);
		elem.innerHTML = html;
	}
}
