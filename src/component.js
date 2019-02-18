class Component {
	/**
	 * Constructs a component at the location of the grid-area.
	 * @param {string} gridArea
	 */
	constructor(gridArea) {
		/**
		 * The style element, if there is style.
		 * @type {HTMLStyleElement}
		 * @private
		 */
		this._style = null;

		/**
		 * The div element.
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._div = document.createElement('div');
		this._div.style.gridArea = gridArea;
		this._div.style.width = '100%';
		document.body.appendChild(this._div);
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		if (this._style !== null) {
			document.head.removeChild(this._style);
			this._style = null;
		}
		document.body.removeChild(this._div);
		this._div = null;
	}

	/**
	 * Returns the style that the component uses.
	 * @returns {string}
	 */
	get __style() {
		if (this._style !== null) {
			return this._style.innerHTML;
		}
		return '';
	}

	/**
	 * Sets the style that the component uses.
	 * @param {string} style
	 */
	set __style(style) {
		if (style !== '') {
			if (this._style === null) {
				this._style = document.createElement('style');
				document.head.appendChild(this._style);
			}
			this._style.innerHTML = style;
		}
		else if (this._style !== null && style === '') {
			document.head.removeChild(this._style);
			this._style = null;
		}
	}

	/**
	 * Returns the div element that the component uses.
	 * @returns {HTMLDivElement}
	 */
	get __div() {
		return this._div;
	}

	/**
	 * Shows an element in an animated way. The element must be a block display style.
	 * @param {number} duration in seconds
	 */
	async show(duration = 0.125) {
		const fps = 30.0;
		if (this._div.style.display !== 'block') {
			this._div.style.opacity = '0';
			this._div.style.display = 'block';
			this._div.setAttribute('showing', '1');
			return new Promise((resolve, reject) => {
				const timer = setInterval((elem) => {
					let u = Number.parseFloat(elem.style.opacity);
					u += 1.0 / (duration * fps);
					u = Math.min(u, 1.0);
					elem.style.opacity = '' + u;
					if (u >= 1.0) {
						clearInterval(timer);
						elem.removeAttribute('showing');
						resolve();
					}
				}, 1000.0 / fps, this._div);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/**
	 * Hides an element in an animated way. The element must be a block display style.
	 * @param {number} duration in seconds
	 */
	async hide(duration = 0.125) {
		const fps = 30.0;
		if (this._div.style.display !== 'none') {
			this._div.style.opacity = '1';
			this._div.setAttribute('hiding', '1');
			return new Promise((resolve, reject) => {
				const timer = setInterval((elem) => {
					let u = Number.parseFloat(elem.style.opacity);
					u -= 1.0 / (duration * fps);
					u = Math.max(u, 0.0);
					elem.style.opacity = '' + u;
					if (u <= 0.0) {
						elem.style.display = 'none';
						clearInterval(timer);
						elem.removeAttribute('hiding');
						resolve();
					}
				}, 1000.0 / fps, this._div);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/**
	 * Returns true if this is shown or showing.
	 * @returns {boolean}
	 */
	isShown() {
		return getComputedStyle(this._div, null).display !== 'none' && !this._div.hasAttribute('hiding');
	}

	/**
	 * Returns true if this is hidden or hiding.
	 * @returns {boolean}
	 */
	isHidden() {
		return getComputedStyle(this._div, null).display === 'none' || this._div.hasAttribute('hiding');
	}
}

export default Component;
