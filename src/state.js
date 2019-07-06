/**
 * @callback Listener
 * @param {string} name
 * @param {any} oldValue
 * @param {any} newValue
 * @returns {void}
 */

/**
 * @typedef {Object} StateValue
 * @property {any} value
 * @property {Array<Listener>} listeners
 */

/**
 * A set of states that can be listened to by others for changes.
 */
export default class State {
	constructor() {
		/**
		 * The set of states.
		 * @type {Object<string, StateValue>}
		 * @private
		 */
		this._state = {};
	}

	/**
	 * Gets the state of the given name.
	 * @param {string} name
	 * @returns {any}
	 */
	get(name) {
		const state = this._state[name];
		if (state === undefined) {
			return undefined;
		}
		return state.value;
	}

	/**
	 * Sets the state to a new value.
	 * @param {string} name
	 * @param {any} newValue
	 */
	set(name, newValue) {
		const state = this._getOrCreate(name);
		const oldValue = state.value;
		state.value = newValue;
		if (oldValue !== newValue) {
			for (let i = 0; i < state.listeners.length; i++) {
				state.listeners[i](name, oldValue, newValue);
			}
		}
	}

	/**
	 * Removes the state and all associated listeners. If the name is not found, it does nothing.
	 * @param {string} name
	 */
	remove(name) {
		const state = this._state[name];
		if (state !== undefined) {
			const oldValue = this._state[name].value;
			const listeners = this._state[name].listeners;
			delete this._state[name];
			if (oldValue !== undefined) {
				for (let i = 0; i < listeners.length; i++) {
					listeners[i](name, oldValue, undefined);
				}
			}
		}
	}

	/**
	 * Adds a listener that is triggered when the state changes value. Returns the listener so it can be used by removeListener.
	 * The event listener is called once immediately if the value is not undefined.
	 * @param {string} name
	 * @param {Listener} listener
	 * @returns {Listener}
	 */
	addListener(name, listener) {
		const state = this._getOrCreate(name);
		state.listeners.push(listener);
		if (state.value !== undefined) {
			listener(name, undefined, state.value);
		}
		return listener;
	}

	/**
	 * Removes a listener from the state. If the name or the listener is not found, it does nothing.
	 * @param {string} name
	 * @param {Listener} listener
	 */
	removeListener(name, listener) {
		const state = this._state[name];
		if (state !== undefined) {
			for (let i = 0; i < state.listeners.length; i++) {
				if (state.listeners[i] === listener) {
					state.listeners.splice(i, 1);
				}
			}
		}
	}

	/**
	 * Returns the state of the given name. If it doesn't exist, it creates it.
	 * @param {string} name
	 * @returns {StateValue}
	 */
	_getOrCreate(name) {
		let state = this._state[name];
		if (state === undefined) {
			this._state[name] = {
				value: undefined,
				listeners: []
			};
			state = this._state[name];
		}
		return state;
	}
}
