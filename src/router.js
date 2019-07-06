/**
 * A simple router. When a route is processed, the callback is called.
 * The callback's param is the route split by slashes as a list of tokens.
 */
class Router {
	/**
	 * Constructs the router.
	 */
	constructor() {
		/**
		 * @type {(route:string[], query:Object<string, string>) => void}
		 * @private
		 */
		this._callback = undefined;

		// Add an event listener so that it processes an event when the user uses the History API, calling the callback.
		window.addEventListener('popstate', () => {
			this.processDocumentLocation();
		});
	}

	/**
	 * Sets the callback when a route is processed.
	 * @param {(route:string[], query:Object<string, string>) => void} callback
	 */
	setCallback(callback) {
		this._callback = callback;
	}

	/**
	 * Pushes a route to the history and process it, calling the callback.
	 * @param {string} [route]
	 * @param {Object<string, string>} [query]
	 */
	pushRoute(route, query) {
		let routeTokens = route.split('/');
		let queryString = '';
		if (query) {
			for (const key in query) {
				queryString += encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
			}
		}
		history.pushState(undefined, '', (route ? '#' : '') + route + (query ? '?' : '') + queryString);
		if (this._callback) {
			this._callback(routeTokens, query);
		}
	}

	/**
	 * Processes the route in the document location hash, calling the callback.
	 */
	processDocumentLocation() {
		// Get the route.
		const routeString = decodeURIComponent(document.location.hash.substr(1));
		const route = routeString.split('/');

		// Get the query.
		const urlSearchParams = new URLSearchParams(location.search);
		/** @type {Object<string, string>} */
		const query = {};
		for (const entry of urlSearchParams.entries()) {
			query[entry[0]] = entry[1];
		}
		if (this._callback) {
			this._callback(route, query);
		}
	}
}

export default Router;
