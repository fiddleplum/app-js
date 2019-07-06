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
		 * The HTML element that this component uses.
		 * @type {HTMLElement}
		 * @private
		 */
		this._elem = elem;

		// Go through each of the component's ancestors,
		let thisAncestor = Object.getPrototypeOf(this);
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
					document.head.appendChild(styleElem);
				}
				styleElem.useCount += 1;
			}
			thisAncestor = Object.getPrototypeOf(thisAncestor);
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
}
