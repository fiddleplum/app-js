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
		 * The current page.
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

	/**
	 * Sets the message HTML.
	 * @param {string} message
	 */
	set message(message) {
		console.log(message);
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
		if (this._page !== null) {
			this._page.destroy();
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
	body {
		margin: 0;
		min-height: 100vh;
	}
	.SimpleApp {
		margin: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 2rem 1fr;
		grid-template-areas:
			"title message"
			"page page";
	}
	.SimpleApp > #title {
		grid-area: title;
		padding: 0.25rem;
		font-size: 1.5rem;
		line-height: 1.5rem;
	}
	.SimpleApp > #title a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp > #title a:hover {
		text-decoration: underline;
	}
	.SimpleApp > #message {
		grid-area: message;
		text-align: right;
		line-height: 1rem;
		padding: .5rem;
	}
	.SimpleApp > #message a {
		color: inherit;
		text-decoration: none;
	}
	.SimpleApp > #message a:hover {
		text-decoration: underline;
	}
	.SimpleApp > #page {
		position: relative;
		grid-area: page;
		width: calc(100% - 2rem);
		max-width: 50rem;
		margin: 1rem auto 0 auto;
	}
	.SimpleApp > #page.fadeOut {
		opacity: 0;
		transition: opacity .125s;
	}
	.SimpleApp > #page.fadeIn {
		opacity: 1;
		transition: opacity .125s;
	}
	`;

App.setAppClass(SimpleApp);
