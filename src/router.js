/**
 * A simple router. Each route is a series of regular expressions separated by slashes.
 * Each route is associated with a callback to be called when the route is matched during processing.
 * A default route, when there are no matches, can be set with the empty string as the pattern.
 */
class Router {
	constructor() {
		/**
		 * @type {RoutePattern[]}
		 * @private
		 */
		this._routePatterns = [];

		/**
		 * @type {function(string[]):undefined}
		 * @private
		 */
		this._defaultCallback = null;

		// Add an event listener so that it processes an event when the user uses the History API.
		window.addEventListener('popstate', async (event) => {
			this.processDocumentLocation();
		});
	}

	/**
	 * Register a new route as a series of regular expressions separated by slashes.
	 * Use an empty string to set the default callback.
	 * @param {string} patternString
	 * @param {function(string[]):undefined} callback
	 */
	registerRoute(patternString, callback) {
		if (patternString !== '') {
			this._routePatterns.push(new RoutePattern(patternString, callback));
		}
		else {
			this._defaultCallback = callback;
		}
	}

	/**
	 * Unregister a previously registered route.
	 * @param {string} patternString
	 */
	unregisterRoute(patternString) {
		let patternTokens = patternString.split('/');
		if (patternTokens.length === 1 && patternTokens[0] === '') {
			this._defaultCallback = null;
			return;
		}
		for (let i = 0; i < this._routePatterns.length; i++) {
			if (this._routePatterns[i].compare(patternTokens)) {
				this._routePatterns.splice(i, 1);
				return;
			}
		}
	}

	/**
	 * Push a route to the history and process it.
	 * @param {string} routeString
	 */
	pushRoute(routeString) {
		history.pushState(undefined, '', '#' + routeString);
		this.processRoute(routeString);
	}

	/**
	 * Process the route in the document location hash.
	 */
	processDocumentLocation() {
		this.processRoute(decodeURIComponent(document.location.hash.substr(1)));
	}

	/**
	 * Parse a route and call the matching route pattern's callback.
	 * @param {string} routeString
	 */
	processRoute(routeString) {
		let route = routeString.split('/');
		if (route.length > 1 || route[0] !== '') {
			for (let i = 0; i < this._routePatterns.length; i++) {
				let routePattern = this._routePatterns[i];
				if (routePattern.match(route)) {
					if (routePattern.callback) {
						routePattern.callback(route);
					}
					return;
				}
			}
		}
		if (this._defaultCallback) {
			this._defaultCallback(route);
		}
	}
}

/**
 * A route pattern used by Router.
 * @private
 */
class RoutePattern {
	/**
	 * Constructs a route pattern.
	 * @param {string} patternString
	 * @param {function(string):undefined} callback
	 */
	constructor(patternString, callback) {
		/**
		 * @type {RegExp[]}
		 */
		this.patterns = [];

		/**
		 * @type {function(string[]):undefined}
		 */
		this.callback = callback;

		// Parse patternString to create regular expressions.
		let patternTokens = patternString.split('/');
		if (patternTokens.length === 1 && patternTokens[0] === '') {
			patternTokens = [];
		}
		for (let i = 0, l = patternTokens.length; i < l; i++) {
			this.patterns.push(new RegExp(patternTokens[i]));
		}
	}

	/**
	 * Returns true if the route matches this.
	 * @param {string[]} route
	 * @returns {boolean}
	 */
	match(route) {
		for (let i = 0, l = this.patterns.length; i < l; i++) {
			if (!this.patterns[i].test(i < route.length ? route[i] : '')) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if the route tokens and this match.
	 * @param {string[]} routeTokens
	 * @returns {boolean}
	 */
	compare(routeTokens) {
		if (routeTokens.length !== this.patterns.length) {
			return false;
		}
		for (let i = 0, l = this.patterns.length; i < l; i++) {
			if (this.patterns[i].source !== routeTokens[i]) {
				return false;
			}
		}
		return true;
	}
}

export default Router;
