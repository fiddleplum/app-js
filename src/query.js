export default class Query {
	constructor() {
		/**
		 * The current query.
		 * @type {Object<string, string>}
		 * @private
		 */
		this._query = {};

		/**
		 * The callback to be called when the query changes.
		 * @type {(query:Object<string, string>) => void}
		 * @private
		 */
		this._callback = undefined;

		// Add an event listener so that it processes an event when the user uses the History API, calling the callback.
		window.addEventListener('popstate', () => {
			this.processLocation();
		});
	}

	/**
	 * Gets value of the given URL query param.
	 * @param {string} key
	 * @returns {string}
	 */
	get(key) {
		return this._query[key];
	}

	/**
	 * Sets the callback when the URL query params have changed.
	 * @param {(query:Object<string, string>) => void} callback
	 */
	setCallback(callback) {
		this._callback = callback;
	}

	/**
	 * Pushes a query to the history and process it, calling the callback.
	 * @param {Object<string, string>} query
	 */
	push(query) {
		let queryString = '';
		if (query) {
			for (const key in query) {
				if (queryString !== '') {
					queryString += '&';
				}
				queryString += encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
			}
		}
		this._query = JSON.parse(JSON.stringify(query));
		history.pushState(undefined, '', (query ? '?' : '') + queryString);
		if (this._callback) {
			this._callback(query);
		}
	}

	/**
	 * Processes the URL query params and calls the callback.
	 */
	processLocation() {
		const urlSearchParams = new URLSearchParams(location.search);
		this._query = {};
		for (const entry of urlSearchParams.entries()) {
			this._query[entry[0]] = entry[1];
		}
		if (this._callback) {
			this._callback(JSON.parse(JSON.stringify(this._query)));
		}
	}
}
