export default class UIComponent {
	/**
	 * Constructs a component inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		/**
		 * The HTML element that this uses.
		 * @type {HTMLElement}
		 * @private
		 */
		this._elem = elem;

		/**
		 * The style element, which is added to the head, if there is style.
		 * @type {HTMLStyleElement}
		 * @private
		 */
		this._styleElem = document.querySelector('head style#' + this.constructor.name);

		// Set the html.
		if (this.constructor.html !== undefined) {
			this._elem.innerHTML = this.constructor.html;
		}
		else {
			this._elem.innerHTML = '';
		}

		// Add the component's name and its ancestors to the class list.
		let thisAncestor = this;
		while (thisAncestor.constructor !== UIComponent) {
			this._elem.classList.add(thisAncestor.constructor.name);
			thisAncestor = Object.getPrototypeOf(thisAncestor);
		}

		// Create the style if it doesn't already exist, and increment the use count.
		if (this._styleElem === null && this.constructor.style !== undefined) {
			this._styleElem = document.createElement('style');
			this._styleElem.id = this.constructor.name;
			this._styleElem.attributes['useCount'] = 0;
			this._styleElem.innerHTML = this.constructor.style;
			document.head.appendChild(this._styleElem);
		}
		this._styleElem.attributes['useCount'] += 1;
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		// Decrement the use count of the style element and remove it if the use count is zero.
		if (this.constructor.style !== undefined) {
			this._styleElem.attributes['useCount'] -= 1;
			if (this._styleElem.attributes['useCount'] === 0) {
				document.head.removeChild(this._styleElem);
			}
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
	 * Returns the HTML element that this uses.
	 * @returns {HTMLElement}
	 */
	get elem() {
		return this._elem;
	}
}

/**
 * The HTML string, which is overridden by the subclass.
 * @type {string}
 */
UIComponent.html = '';

/**
 * The style string, which is overidden by the subclass.
 * @type {string}
 */
UIComponent.style = '';
