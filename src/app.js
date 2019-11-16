import Component from './component';
import Router from './router';

export default class App extends Component {
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
		 * The router system.
		 * @type {Router}
		 * @private
		 */
		this._router = new Router();

		// Make this global.
		window.app = this;
	}

	/**
	 * Gets the router system.
	 * @returns {Router}
	 */
	get router() {
		return this._router;
	}
}

App.style = `
	* {
		box-sizing: border-box;
	}

	.vertical-align {
		display: flex;
		justify-content: center;
		flex-direction: column;
	}

	.no-select {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	`;

/**
 * The subclass of App to be instantiated.
 * @type {App}
 * @private
 */
App._appClass = App;

window.addEventListener('load', () => {
	try {
		// eslint-disable-next-line no-new
		new App._appClass();
	}
	catch (error) {
		console.error(error);
	}
});
