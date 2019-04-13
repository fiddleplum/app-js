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

		// Add the component's name and its ancestors to the class list.
		let thisAncestor = this;
		while (thisAncestor.constructor !== UIComponent) {
			this._elem.classList.add(thisAncestor.constructor.name);
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}

		// Create the style if it doesn't already exist, and increment the use count.
		if (this._style === null) {
			this._style = document.createElement('style');
			this._style.id = this.constructor.name;
			this._style.attributes['useCount'] = 0;
			this._style.innerHTML = this.constructor.style || '';
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

		// Remove the component's name and its ancestors from the class list.
		let thisAncestor = this;
		while (thisAncestor.constructor !== UIComponent) {
			this._elem.classList.remove(thisAncestor.constructor.name);
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}

		// Clear out any html from the parent element.
		this._elem.innerHTML = '';
	}

	/**
	 * Gets the elem that this component uses.
	 * @returns {HTMLElement}
	 */
	get elem() {
		return this._elem;
	}
}

export default Component;
