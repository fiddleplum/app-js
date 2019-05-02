/**
 * A base UI component from which other components can extend.
 */
export default class UIComponent {
	/**
	 * Constructs a component inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		/**
		 * The HTML element that this component uses.
		 * @type {HTMLElement}
		 * @private
		 */
		this._elem = elem;

		// Go through each of the component's ancestors,
		let thisAncestor = this;
		while (thisAncestor.constructor !== UIComponent) {
			// Add the ancestor's name to the class list.
			this._elem.classList.add(thisAncestor.constructor.name);
			thisAncestor = Object.getPrototypeOf(thisAncestor);

			// Create the ancestor's style element if it doesn't already exist, and increment the use count.
			if (thisAncestor.constructor.style !== undefined && thisAncestor.constructor.style !== '') {
				let styleElem = document.querySelector('head style#' + thisAncestor.constructor.name);
				if (styleElem === null) {
					styleElem = document.createElement('style');
					styleElem.id = thisAncestor.constructor.name;
					styleElem.attributes['useCount'] = 0;
					styleElem.innerHTML = thisAncestor.constructor.style;
					document.head.appendChild(styleElem);
				}
				styleElem.attributes['useCount'] += 1;
			}
		}

		// Set the html.
		this._elem.innerHTML = this.constructor.html || '';
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		// Clear out any html from the parent element.
		this._elem.innerHTML = '';

		// Go through each of the component's ancestors,
		let thisAncestor = this;
		while (thisAncestor.constructor !== UIComponent) {
			// Remove the ancestor's name from the class list.
			this._elem.classList.remove(thisAncestor.constructor.name);
			thisAncestor = Object.getPrototypeOf(thisAncestor);

			// Decrement the use count of the ancestor's style element and remove it if the use count is zero.
			if (thisAncestor.constructor.style !== undefined) {
				let styleElem = document.querySelector('head style#' + thisAncestor.constructor.name);
				if (styleElem) {
					styleElem.attributes['useCount'] -= 1;
					if (styleElem.attributes['useCount'] === 0) {
						document.head.removeChild(styleElem);
					}
				}
			}
		}
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
