class Component {
	/**
	 * Constructs a component inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		/**
		 * The div element.
		 * @type {HTMLElement}
		 * @private
		 */
		this._elem = elem;

		/**
		 * The style element, which is added to the head, if there is style.
		 * @type {HTMLStyleElement}
		 * @private
		 */
		this._style = document.querySelector('head style#' + this.constructor.name);

		// Add the component's name to the class list.
		this._elem.classList.add(this.constructor.name);

		// Create the style if it doesn't already exist, and increment the use count.
		if (this._style === null) {
			this._style = document.createElement('style');
			this._style.id = this.constructor.name;
			this._style.attributes['useCount'] = 0;
			document.head.appendChild(this._style);
		}
		this._style.attributes['useCount'] += 1;
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		// Decrement the use count of the style element and remove it if the use count is zero.
		this._style.attributes['useCount'] -= 1;
		if (this._style.attributes['useCount'] === 0) {
			document.head.removeChild(this._style);
		}

		// Remove the component's name from the class list.
		this._elem.classList.remove(this.constructor.name);

		// Clear out any html from the parent element.
		this._elem.innerHTML = '';
	}

	/**
	 * Returns the style that the component uses.
	 * @returns {string}
	 */
	get __style() {
		return this._style.innerHTML;
	}

	/**
	 * Sets the style that the component uses.
	 * @param {string} style
	 */
	set __style(style) {
		// Set the style if this is the first element of its type.
		if (this._style.attributes['useCount'] === 1) {
			this._style.innerHTML = style;
		}
	}

	/**
	 * Returns the html that the component uses.
	 * @returns {string}
	 */
	get __html() {
		return this._elem.innerHTML;
	}

	/**
	 * Sets the html that the component uses.
	 * @param {string} html
	 */
	set __html(html) {
		this._elem.innerHTML = html;
	}

	/**
	 * Performs query selector on the component.
	 * @param {string} selector
	 * @param {boolean} [all=false]
	 */
	__query(selector, all = false) {
		if (all) {
			return this._elem.querySelectorAll(selector);
		}
		else {
			return this._elem.querySelector(selector);
		}
	}
}

export default Component;
