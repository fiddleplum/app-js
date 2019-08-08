/**
 * A router that supports query strings, pushing and replacing using the history API.
 */
export default class Router {
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
			this.processURL();
		});
	}

	/**
	 * Gets value of the given URL query param.
	 * @param {string} key
	 * @returns {string}
	 */
	getValueOf(key) {
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
		const queryString = this._createQueryString(query);
		this._query = JSON.parse(JSON.stringify(query));
		history.pushState(undefined, '', (query ? '?' : '') + queryString);
		if (this._callback) {
			this._callback(query);
		}
	}

	/**
	 * Replaces the query at the top of the history. Does not call the callback.
	 * @param {Object<string, string>} query
	 */
	replace(query) {
		const queryString = this._createQueryString(query);
		this._query = JSON.parse(JSON.stringify(query));
		history.replaceState(undefined, '', (query ? '?' : '') + queryString);
	}

	/**
	 * Processes the URL query params and calls the callback.
	 */
	processURL() {
		const urlSearchParams = new URLSearchParams(location.search);
		this._query = {};
		for (const entry of urlSearchParams.entries()) {
			this._query[entry[0]] = entry[1];
		}
		if (this._callback) {
			this._callback(JSON.parse(JSON.stringify(this._query)));
		}
	}

	/**
	 * Turns a query into a string suitable for a URL.
	 * @param {Object<string, string>} query
	 * @returns {string}
	 */
	_createQueryString(query) {
		let queryString = '';
		if (query) {
			for (const key in query) {
				if (queryString !== '') {
					queryString += '&';
				}
				queryString += encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
			}
		}
		return queryString;
	}
}
