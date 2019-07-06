import Router from './router';

/**
 * A slightly more complex router. Each route is a series of regular expressions separated by slashes.
 * Each route is associated with a callback to be called when the route is matched during processing.
 * If there are multiple matching patterns, the pattern with the most tokens is chosen.
 * If there are multiple matching same-length patterns, the first is chosen.
 * A default route, when there are no matches, can be set with the empty string as the pattern.
 */
class RouterEx {
	constructor() {
		/**
		 * The list of patterns to match when processing a route.
		 * @type {RoutePattern[]}
		 * @private
		 */
		this._routePatterns = [];

		/**
		 * The callback called when no other callback is called.
		 * @type {(route:string[], query:Object<string, string>) => void}
		 * @private
		 */
		this._defaultCallback = null;

		/**
		 * The router used by this router.
		 * @type {Router}
		 * @private
		 */
		this._router = new Router();

		// Set the callback for processing the route.
		this._router.setCallback((route, query) => {
			if (route.length > 1 || route[0] !== '') {
				let matchedRoutePattern;
				for (let i = 0; i < this._routePatterns.length; i++) {
					const routePattern = this._routePatterns[i];
					if (routePattern.match(route) && (!matchedRoutePattern || matchedRoutePattern.patterns.length < routePattern.patterns.length)) {
						matchedRoutePattern = routePattern;
					}
				}
				if (matchedRoutePattern) {
					if (matchedRoutePattern.callback) {
						matchedRoutePattern.callback(route, query);
					}
					return;
				}
			}
			if (this._defaultCallback) {
				this._defaultCallback(route, query);
			}
		});
	}

	/**
	 * Register a new route as a series of regular expressions separated by slashes.
	 * Use an empty string to set the default callback.
	 * @param {string} pattern
	 * @param {(route:string[], query:Object<string, string>) => void} callback
	 */
	registerRoute(pattern, callback) {
		if (pattern !== '') {
			this._routePatterns.push(new RoutePattern(pattern, callback));
		}
		else {
			this._defaultCallback = callback;
		}
	}

	/**
	 * Unregister a previously registered route.
	 * @param {string} pattern
	 */
	unregisterRoute(pattern) {
		let patternTokens = pattern.split('/');
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
	 * @param {string} route
	 * @param {Object<string, string>} query
	 */
	pushRoute(route, query) {
		this._router.pushRoute(route, query);
	}

	/**
	 * Process the route in the document location hash.
	 */
	processDocumentLocation() {
		this._router.processDocumentLocation();
	}
}

/**
 * A route pattern used by RouterEx.
 * @private
 */
class RoutePattern {
	/**
	 * Constructs a route pattern.
	 * @param {string} pattern
	 * @param {(route:string[], query:Object<string, string>) => void} callback
	 */
	constructor(pattern, callback) {
		/**
		 * The patterns to match.
		 * @type {RegExp[]}
		 */
		this.patterns = [];

		/**
		 * @type {(route:string[], query:Object<string, string>) => void}
		 */
		this.callback = callback;

		// Parse pattern to create regular expressions.
		let patternTokens = pattern.split('/');
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
			if (i >= route.length) {
				return false;
			}
			if (!this.patterns[i].test(route[i])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if the route tokens and this match.
	 * @param {string[]} route
	 * @returns {boolean}
	 */
	compare(route) {
		if (route.length !== this.patterns.length) {
			return false;
		}
		for (let i = 0, l = this.patterns.length; i < l; i++) {
			if (this.patterns[i].source !== route[i]) {
				return false;
			}
		}
		return true;
	}
}

export default RouterEx;
