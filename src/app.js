import Router from './router';

/** @typedef {import ('./component').default} Component */

class App {
	/**
	 * Sets the subclass of App to be instantiated. It should be called in the main script outside of any function.
	 * @param {App} subclass
	 */
	static setAppSubclass(subclass) {
		App._subclass = subclass;
	}

	constructor() {
		window.app = this;

		/**
		 * @type {Component}
		 * @private
		 */
		this._page = null;

		/**
		 * @type {Router}
		 * @private
		 */
		this._router = new Router();
	}

	/**
	 * @param {string} routeString
	 * @param {function(HTMLElement, Map<string, string>):Component} PageClass
	 */
	registerPage(routeString, PageClass) {
		this._router.registerRoute(routeString, (route) => {
			console.error(route);
			/** @type {Map<string, string>} */
			let options = new Map();
			for (let i = routeString.split('/').length; i < route.length; i += 2) {
				options.set(route[i], route[i + 1]);
			}
			if (this._page !== null) {
				this._page.destroy();
			}
			try {
				this._page = new PageClass(document.body.querySelector('#page'), options);
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

export default App;
