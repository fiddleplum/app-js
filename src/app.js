import Router from './router';
import UIComponent from './ui_component';

export default class App extends UIComponent {
	/**
	 * Sets the subclass of App to be instantiated. It should be called in the main script outside of any function.
	 * @param {App} subclass
	 */
	static setAppSubclass(subclass) {
		App._subclass = subclass;
	}

	/**
	 * Constructs a component inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		super(elem);

		// Make this global.
		window.app = this;

		/**
		 * The element where the page will reside.
		 * @type {HTMLElement}
		 * @private
		 */
		this._pageElem = null;

		/**
		 * The active page.
		 * @type {UIComponent}
		 * @private
		 */
		this._page = null;

		/**
		 * The router for registering routes and pages.
		 * @type {Router}
		 * @private
		 */
		this._router = new Router();
	}

	/**
	 * Sets the page element.
	 * @param {HTMLElement} pageElem
	 */
	set pageElem(pageElem) {
		this._pageElem = pageElem;
	}

	/**
	 * @param {string} routeString
	 * @param {function(HTMLElement, Map<string, string>):UIComponent} PageClass
	 */
	registerPage(routeString, PageClass) {
		this._router.registerRoute(routeString, (route) => {
			/** @type {Map<string, string>} */
			let options = new Map();
			for (let i = routeString.split('/').length; i < route.length; i += 2) {
				options.set(route[i], route[i + 1]);
			}
			if (this._page !== null) {
				this._page.destroy();
			}
			try {
				this._page = new PageClass(this._pageElem, options);
			}
			catch (error) {
				console.error(error);
			}
		});
	}

	goToPage(route) {
		this._router.pushRoute(route);
	}
}

/**
 * The subclass of App to be instantiated.
 * @type {App}
 * @private
 */
App._subclass = App;

document.addEventListener('DOMContentLoaded', () => {
	try {
		new App._subclass();
	}
	catch (error) {
		console.error(error);
	}
});
