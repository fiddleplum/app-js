export default class Util {
	/**
	 * @param {string} tag
	 * @param {HTMLElement} parent
	 * @param {string|string[]} classNames
	 * @param {Object<string, EventListener>} eventListeners
	 */
	static createElement(tag, parent, classNames, eventListeners) {
		const elem = document.createElement(tag);
		if (typeof classNames === 'string') {
			elem.classList.add(classNames);
		}
		else {
			for (let i = 0; i < classNames.length; i++) {
				elem.classList.add(classNames[i]);
			}
		}
		for (const type of Object.keys(eventListeners)) {
			elem.addEventListener(type, eventListeners[type]);
		}
		parent.appendChild(elem);
	}
};
