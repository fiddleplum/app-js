import App from './app';
/** @typedef {import('./component').default} Component */

export default class SimpleApp extends App {
	constructor() {
		super();

		/**
		 * A mapping from queries to pages.
		 * @type {Map<Object<string, string>, (elem:HTMLElement, app:SimpleApp) => Component>}
		 * @private
		 */
		this._queriesToPages = new Map();

		// Set the callback to compare the given query to the matched queries.
		// If there are multiple matches, it chooses the first longest match.
		this.query.setCallback((query) => {
			let bestQueryToMatch;
			for (const queryToMatch of this._queriesToPages.keys()) {
				let matched = true;
				for (const key in queryToMatch) {
					if (query[key] !== queryToMatch[key]) {
						matched = false;
						break;
					}
				}
				if (!matched) {
					continue;
				}
				if (!bestQueryToMatch || Object.keys(bestQueryToMatch).length < Object.keys(queryToMatch).length) {
					bestQueryToMatch = queryToMatch;
				}
			}
			if (bestQueryToMatch) {
				const PageClass = this._queriesToPages.get(bestQueryToMatch);
				this.__removeComponent('page');
				this.__addComponent('page', PageClass, 'page', this);
			}
		});
	}

	/**
	 * Sets the title HTML.
	 * @param {string} title
	 */
	set title(title) {
		this.elem.querySelector('#title').innerHTML = '<a href="">' + title + '</a>';
	}

	/**
	 * Registers a component as a page connected to a query.
	 * @param {Object<string, string>} queryToMatch
	 * @param {(elem:HTMLElement, app:SimpleApp) => Component} PageClass
	 */
	registerPage(queryToMatch, PageClass) {
		this._queriesToPages.set(queryToMatch, PageClass);
	}
}

SimpleApp.html = `
	<div id="title"></div>
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
		font-size: 1em;
		line-height: 2em;
		background: var(--bg-dark);
		color: var(--fg-dark);
	}
	.SimpleApp > #title a {
		color: var(--fg-dark);
		text-decoration: none;
	}
`;

App.setAppClass(SimpleApp);
