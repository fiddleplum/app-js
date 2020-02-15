/**
 * @template Value
 */
class TreeNode {
	/**
	 * @param {Value} value
	 * @param {TreeNode<Value>} parent
	 */
	constructor(value, parent) {
		/**
		 * The value.
		 * @type {Value}
		 */
		this._value = value;

		/**
		 * The parent.
		 * @type {TreeNode<Value>}
		 */
		this._parent = parent;

		/**
		 * The children.
		 * @type {TreeNode<Value>[]}
		 */
		this._children = [];
	}

	/**
	 * Gets the value.
	 * @returns {Value}
	 */
	getValue() {
		return this._value;
	}

	/**
	 * Sets the value.
	 * @param {Value} value
	 */
	setValue(value) {
		this._value = value;
	}

	/**
	 * Gets the parent.
	 * @returns {TreeNode<Value>}
	 */
	getParent() {
		return this._parent;
	}

	/**
	 * Gets the number of children.
	 * @returns {number}
	 */
	getNumChildren() {
		return this._children.length;
	}

	/**
	 * Gets the child at the index.
	 * @param {number} index
	 * @returns {TreeNode<Value>}
	 */
	getChild(index) {
		if (index < 0 || this._children.length >= index) {
			throw new Error('Child index out of bounds.');
		}
		return this._children[index];
	}

	/**
	 * Adds a child.
	 * @param {Value} value
	 * @param {TreeNode<Value>} before
	 */
	addChild(value, before) {
		for (let i = 0, l = this._children.length; i < l; i++) {
			if (this._children[i] === before) {
				this._children.splice(i, 0, new TreeNode(value, this));
				return;
			}
		}
		throw new Error('Before node not found while adding child.');
	}

	/**
	 * Removes a child and its descendents. Returns the child.
	 * @param {number} index
	 * @returns {TreeNode<Value>}
	 */
	removeChild(index) {
		if (index < 0 || this._children.length >= index) {
			throw new Error('Child index out of bounds.');
		}
		const child = this._children[index];
		child._parent = null;
		this._children.splice(index, 1);
		return child;
	}
}

export default TreeNode;
