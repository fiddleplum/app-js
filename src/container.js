import Component from './component';

/**
 * A container that contains components.
 */
export default class Container extends Component {
	/**
	 * Constructs a container inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		super(elem);

		/**
		 * The mapping of elemIds to components.
		 * @type {Map<string, Component>}
		 * @private
		 */
		this._components = new Map();
	}

	/**
	 * Destroys this when it is no longer needed. Call to clean up the object.
	 */
	destroy() {
		for (const component of this._components.values()) {
			component.destroy();
		}
		super.destroy();
	}

	/**
	 * Gets the component at the element with the id of *elemId*. Returns undefined if there is no component at the element.
	 * @param {string} elemId
	 * @returns {Component}
	 */
	__getComponent(elemId) {
		const component = this._components.get(elemId);
		return component;
	}

	/**
	 * Unsets (removes) the component at the element with the id of *elemId*. Does nothing if there is no component at that element.
	 * @param {string} elemId
	 */
	__unsetComponent(elemId) {
		const component = this._components.get(elemId);
		if (component) {
			component.destroy();
			this._components.delete(elemId);
		}
	}

	/**
	 * Sets a new component at the element with the id of *elemId*. If there is already a component at that element, the component is first removed.
	 * @template ComponentType
	 * @param {new (elem:string, ...) => ComponentType} ComponentType
	 * @param {string} elemId
	 * @param {...any} params
	 * @returns {ComponentType}
	 */
	__setComponent(ComponentType, elemId, ...params) {
		const component = this._components.get(elemId);
		if (component) {
			component.destroy();
			this._components.delete(elemId);
		}
		const newComponent = new ComponentType(this.elem.querySelector('#' + elemId), ...params);
		this._components.set(elemId, newComponent);
		return newComponent;
	}
}
