/**
 * A map that is O(1) in both directions.
 * @template K
 * @template V
 */
export default class Bimap {
	/**
	 * @param {Iterable<readonly [K, V]>} [iterable]
	 */
	constructor(iterable) {
		/**
		 * @type {Map<K, V>}
		 * @private
		 */
		this._keyMap = new Map();

		/**
		 * @type {Map<V, K>}
		 * @private
		 */
		this._valueMap = new Map();

		// Set the iterable entries.
		if (iterable !== undefined) {
			for (const [key, value] of iterable) {
				this._keyMap.set(key, value);
				this._valueMap.set(value, key);
			}
		}
	}

	// ACCESS

	/**
	 * Gets the value from the key.
	 * @param {K} key
	 * @returns {V}
	 */
	getValue(key) {
		return this._keyMap.get(key);
	}

	/**
	 * Gets the key from the value.
	 * @param {V} value
	 * @returns {K}
	 */
	getKey(value) {
		return this._valueMap.get(value);
	}

	/**
	 * Returns true if the key exists.
	 * @param {K} key
	 * @returns {boolean}
	 */
	hasKey(key) {
		return this._keyMap.has(key);
	}

	/**
	 * Returns true if the value exists.
	 * @param {V} value
	 * @returns {boolean}
	 */
	hasValue(value) {
		return this._valueMap.has(value);
	}

	/**
	 * Gets the number of entries.
	 * @returns {number}
	 */
	get size() {
		return this._keyMap.size;
	}

	// MODIFY

	/**
	 * Sets a key-value pair.
	 * @param {K} key
	 * @param {V} value
	 */
	set(key, value) {
		this._keyMap.set(key, value);
		this._valueMap.set(value, key);
	}

	/**
	 * Deletes a key-value pair from the key.
	 * @param {K} key
	 */
	delete(key) {
		const value = this._keyMap.get(key);
		if (value !== undefined) {
			this._keyMap.delete(key);
			this._valueMap.delete(value);
		}
	}

	/**
	 * Clears all key-value pairs.
	 */
	clear() {
		this._keyMap.clear();
		this._valueMap.clear();
	}

	// ITERATE

	/**
	 * Gets the entries iterator.
	 * @returns {IterableIterator<K>}
	 */
	keys() {
		return this._keyMap.keys();
	}

	/**
	 * Gets the entries iterator.
	 * @returns {IterableIterator<V>}
	 */
	values() {
		return this._keyMap.values();
	}

	/**
	 * Gets the entries iterator.
	 * @returns {IterableIterator<[K, V]>}
	 */
	entries() {
		return this._keyMap.entries();
	}

	/**
	 * Gets the entries iterator.
	 * @param {(value: V, key: K, map: Map<K, V>) => void} callback
	 */
	forEach(callback) {
		this._keyMap.forEach(callback);
	}

	/**
	 * Gets the entries iterator.
	 * @returns {IterableIterator<[K, V]>}
	 */
	[Symbol.iterator]() {
		return this._keyMap.entries();
	}
}
