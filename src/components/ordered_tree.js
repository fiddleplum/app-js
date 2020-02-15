import html from './ordered_tree.html';
import style from './ordered_tree.css';
import Component from '../component';
import TreeNode from './tree_node';

/** Use the UX from here: https://demos.telerik.com/kendo-ui/treeview/dragdrop
 */

/*

When you grab a group category, it moves the whole group together, whether up or down or outward or inward.
When you move a child category outside of its parent, it moves up to the parent level.

*/

/**
 * @typedef {string|Entry[]} Entry
 */

/**
 * An ordered tree.
 */
export default class OrderedTree extends Component {
	/**
	 * Constructs the app.
	 * @param {HTMLElement} elem - The element inside which thee the component will reside.
	 */
	constructor(elem) {
		super(elem);

		/**
		 * The root node.
		 * @type {TreeNode<string>}
		 */
		this._root = new TreeNode('', null);

		/**
		 * The list of items, with each item being either a string or an array with the previous item as the parent.
		 * @type {Array<Entry>}
		 */
		this._items = [];

		/**
		 * The currently selected item.
		 * @type {string}
		 */
		this._selected = '';
	}

	/**
	 * Adds an item as an array that contains all of the ancestors of the item, including the item itself.
	 * If the ancestors are missing or the item already exists, it throws an exception.
	 * @param {string[]} itemAncestors
	 * @param {string} item
	 * @param {string} before
	 */
	addItem(itemAncestors, item, before) {
		let currentItems = this._items;
		for (let i = 0; i < itemAncestors.length; i++) { // Go through each ancestor.
			const ancestorIndex = currentItems.indexOf(itemAncestors[i]);
			if (ancestorIndex === -1) {
				throw new Error(`Ancestor "${itemAncestors[i]}" not found.`);
			}
			else { // Still more ancestors.
				if (ancestorIndex + 1 === currentItems.length || !Array.isArray(currentItems[ancestorIndex + 1])) {
					throw new Error(`Ancestor "${itemAncestors[i]}" has no children.`);
				}
				currentItems = currentItems[ancestorIndex + 1];
			}
		}
		if (before) {
			const beforeIndex = currentItems.indexOf(before);
			if (beforeIndex === -1) {
				throw new Error(`Before item "${before}" not found.`);
			}
			currentItems.splice(beforeIndex, 0, item);
		}
	}

	set items (items) {
		for (let i = 0; i < this._items.length; i++) {
		}
	}

	_render(items, level) {
		let html = '';
		for (let i = 0; i < items.length; i++) {
			html += `<p class="item" style="margin-left: ${level}em;"`;
			if (this._selected === items[i]) {
				html += `
					><button class="grabber"
						onMouseDown="_onDragItemStart"
						onTouchStart="_onDragItemStart"
						onMouseUp="_onDragItemEnd"
						onMouseLeave="._onDragItemEnd"
						onTouchEnd="_onDragItemEnd">#</button>
					<input type="text" defaultValue=${items[i]}></input>
					`;
			}
			else {
				html += `
						onMouseDown="_onSelectItemStart"
						onTouchStart="_onSelectItemStart"
						onMouseUp="_onSelectItemEnd"
						onMouseLeave="_onSelectItemEnd"
						onTouchEnd="_onSelectItemEnd">${items[i]}
						`;
			}
			html += `</p>`;
			if (i < items.length - 1 && Array.isArray(items[i + 1])) { // Category with sub-categories
				html += `<div class="subcategories">${this._renderCategories(items[i + 1], level + 1)}</div>`;
				i += 1;
			}
		}
		return html;
	}

	_onDragItemStart(event) {
	}

	_onDragItemEnd(event) {
	}

	_onSelectItemStart(event) {
	}

	_onSelectItemEnd(event) {
	}
}

OrderedTree.html = html;

OrderedTree.style = style;