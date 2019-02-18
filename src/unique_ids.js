/**
 * A generator of ids that are unique per instance of the class.
 */
class UniqueIds {
	/**
	 * Constructor.
	 */
	constructor() {
		/**
		 * The free ids. If there are no free ids, the next free id is the number used.
		 * @type {number}
		 * @private
		 */
		this._freeIds = [];

		/**
		 * The number of used ids.
		 * @type {number}
		 * @private
		 */
		this._numUsed = 0;
	}

	/**
	 * Gets a unique id.
	 * @returns {number}
	 */
	get() {
		let id;
		if (this._freeIds.length === 0) {
			id = this._numUsed;
		}
		else {
			id = this._freeIds.pop();
		}
		this._numUsed += 1;
		return id;
	}

	/**
	 * Releases a previously gotten id.
	 * @param {number} id
	 */
	release(id) {
		this._freeIds.push(id);
		this._numUsed -= 1;
	}
}

export default UniqueIds;
