import App from './app';

export default class SimpleApp extends App {
	constructor() {
		super();

		this.pageElem = document.body.querySelector('#page');
	}

	/**
	 * Gets the title HTML.
	 * @returns {string}
	 */
	get title() {
		return document.body.querySelector('#title').innerHTML;
	}

	/**
	 * Sets the title HTML.
	 * @param {string} title
	 */
	set title(title) {
		document.body.querySelector('#title').innerHTML = title;
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
	}
`;

App.setAppSubclass(SimpleApp);
