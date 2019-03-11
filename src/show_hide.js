class ShowHide {
	/**
	 * Shows an element in an animated way. The element must be a block display style.
	 * @param {HTMLElement} element
	 * @param {number} duration in seconds
	 */
	static async show(element, duration = 0.125) {
		const fps = 30.0;
		if (element.style.display !== 'block') {
			element.style.opacity = '0';
			element.style.display = 'block';
			element.setAttribute('showing', '1');
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
				}, 1000.0 / fps, element);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/**
	 * Hides an element in an animated way. The element must be a block display style.
	 * @param {HTMLElement} element
	 * @param {number} duration in seconds
	 */
	static async hide(element, duration = 0.125) {
		const fps = 30.0;
		if (element.style.display !== 'none') {
			element.style.opacity = '1';
			element.setAttribute('hiding', '1');
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
				}, 1000.0 / fps, element);
			});
		}
		else {
			return Promise.resolve();
		}
	}

	/**
	 * Returns true if this is shown or showing.
	 * @param {HTMLElement} element
	 * @returns {boolean}
	 */
	static isShown(element) {
		return getComputedStyle(element, null).display !== 'none' && !element.hasAttribute('hiding');
	}

	/**
	 * Returns true if this is hidden or hiding.
	 * @param {HTMLElement} element
	 * @returns {boolean}
	 */
	static isHidden(element) {
		return getComputedStyle(element, null).display === 'none' || element.hasAttribute('hiding');
	}
}

export default ShowHide;
