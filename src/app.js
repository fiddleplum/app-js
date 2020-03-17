import Component from './component';
import Router from './router';

export default class App extends Component {
	/**
	 * Sets the subclass of App to be instantiated. It should be called in the main script outside of any function.
	 * @param {typeof App} appClass
	 */
	static setAppClass(appClass) {
		App._appClass = appClass;
	}

	/**
	 * Constructs a component inside the body.
	 */
	constructor() {
		super(new Component.Params());

		/**
		 * The router system.
		 * @type {Router}
		 */
		this._router = new Router();

		// Make this global.
		// @ts-ignore
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

App.css = `
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

App.register();

/**
 * The subclass of App to be instantiated.
 * @type {typeof App}
 */
App._appClass = App;

window.addEventListener('load', () => {
	try {
		// eslint-disable-next-line no-new
		const app = new App._appClass();
		document.body.append(...app._rootNodes);
	}
	catch (error) {
		console.error(error);
	}
});
