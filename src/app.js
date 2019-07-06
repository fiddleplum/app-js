import Container from './container';
import Query from './query';

export default class App extends Container {
	/**
	 * Sets the subclass of App to be instantiated. It should be called in the main script outside of any function.
	 * @param {App} appClass
	 */
	static setAppClass(appClass) {
		App._appClass = appClass;
	}

	/**
	 * Constructs a component inside the body.
	 */
	constructor() {
		super(document.body);

		/**
		 * The query system.
		 * @type {Query}
		 * @private
		 */
		this._query = new Query();

		// Make this global.
		window.app = this;
	}

	/**
	 * Gets the query system.
	 * @returns {Query}
	 */
	get query() {
		return this._query;
	}
}

/**
 * The subclass of App to be instantiated.
 * @type {App}
 * @private
 */
App._appClass = App;

window.addEventListener('load', () => {
	try {
		new App._appClass();
	}
	catch (error) {
		console.error(error);
	}
});
