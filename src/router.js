/**
 * A router that supports query strings, pushing and replacing using the history API.
 */
export default class Router {
	/**
	 * @callback Callback
	 * @param {Object<string, string>} query
	 * @returns {void}
	 */

	/**
	 * The constructor.
	 */
	constructor() {
		/**
		 * The current query.
		 * @type {Object<string, string>}
		 * @private
		 */
		this._query = {};

		/**
		 * The callback to be called when the query changes.
		 * @type {Callback[]}
		 * @private
		 */
		this._callbacks = [];

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
	getValue(key) {
		return this._query[key];
	}

	/**
	 * Adds the callback for when the URL query params have changed.
	 * @param {Callback} callback
	 */
	addCallback(callback) {
		this._callbacks.push(callback);
	}

	/**
	 * Removes the callback for when the URL query params have changed.
	 * @param {Callback} callback
	 */
	removeCallback(callback) {
		for (let i = 0, l = this._callbacks.length; i < l; i++) {
			if (this._callbacks[i] === callback) {
				this._callbacks.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * Pushes a query to the history and process it, calling the callback.
	 * @param {Object<string, string>} query
	 */
	pushQuery(query) {
		const queryString = this._createQueryString(query);
		this._query = JSON.parse(JSON.stringify(query));
		history.pushState(undefined, '', (query ? '?' : '') + queryString);
		this._callCallbacks();
	}

	/**
	 * Replaces the query at the top of the history. Does not call the callback.
	 * @param {Object<string, string>} query
	 */
	replaceQuery(query) {
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
		this._callCallbacks();
	}

	/**
	 * Turns a query into a string suitable for a URL.
	 * @param {Object<string, string>} query
	 * @returns {string}
	 * @private
	 */
	_createQueryString(query) {
		let queryString = '';
		if (query) {
			for (const key in query) {
				if (query[key] === undefined || query[key] === '') {
					continue;
				}
				if (queryString !== '') {
					queryString += '&';
				}
				queryString += encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
			}
		}
		return queryString;
	}

	/**
	 * Calls all of the callbacks with the current query.
	 * @private
	 */
	_callCallbacks() {
		for (let i = 0, l = this._callbacks.length; i < l; i++) {
			this._callbacks[i](this._query);
		}
	}
}
