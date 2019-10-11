import App from './app';
/** @typedef {import('./component').default} Component */

export default class SimpleApp extends App {
	constructor() {
		super();

		/**
		 * A mapping from page names to page components.
		 * @type {Map<string, (elem:HTMLElement, app:SimpleApp) => Component>}
		 * @private
		 */
		this._pages = new Map();

		/**
		 * The currnent page.
		 * @type {Component}
		 * @private
		 */
		this._page = null;

		// Setup the router callback.
		this.router.setCallback(this._processQuery.bind(this));
	}

	/**
	 * Sets the title HTML.
	 * @param {string} title
	 */
	set title(title) {
		this.elem.querySelector('#title a').innerHTML = title;
	}

	set message(message) {
		this.elem.querySelector('#message').innerHTML = message;
	}

	/**
	 * Registers a component as a page.
	 * @param {string} pageName
	 * @param {(elem:HTMLElement, app:SimpleApp) => Component} PageClass
	 */
	registerPage(pageName, PageClass) {
		this._pages.set(pageName, PageClass);
	}

	/**
	 * Processes a query, loading a page.
	 * @param {Object<string, string>} query
	 * @private
	 */
	_processQuery(query) {
		const pageName = query.page || '';
		const Page = this._pages.get(pageName);
		if (Page === undefined) {
			this.message = 'Page not found. Return to <a href=".">home</a>.';
			return;
		}
		this._page = new Page(document.querySelector('#page'), this);
	}
}

SimpleApp.html = `
	<div id="title"><a href="."></a></div>
	<div id="message"></div>
	<div id="page"></div>
	`;

SimpleApp.style = `
	.SimpleApp {
		margin: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 2em 2em 1fr;
		grid-template-areas:
			"title"
			"message"
			"page";
		background: var(--bg-light);
		color: var(--fg-light);
	}
	.SimpleApp > #title {
		grid-area: title;
		text-align: center;
		background: var(--bg-dark);
		color: var(--fg-dark);
	}
	.SimpleApp > #title a {
		color: var(--fg-dark);
		text-decoration: none;
	}
	.SimpleApp > #title a:hover {
		text-decoration: underline;
	}
	.SimpleApp > #message a {
		color: var(--fg-dark);
		text-decoration: none;
	}
	.SimpleApp > #message a:hover {
		text-decoration: underline;
	}
`;

App.setAppClass(SimpleApp);
