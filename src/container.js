import Component from './component';

/**
 * A container that contains components.
 */
export default class Container extends Component {
	/**
	 * Constructs a view inside the parent element.
	 * @param {HTMLElement} elem
	 */
	constructor(elem) {
		super(elem);

		/**
		 * The mapping of names to components.
		 * @type {Map<string, Component>}
		 * @private
		 */
		this._components = new Map();
	}

	/**
	 * Gets a component. Returns undefined if there is no component with that name.
	 * @param {string} name
	 * @returns {Component}
	 */
	__getComponent(name) {
		const component = this._components.get(name);
		return component;
	}

	/**
	 * Removes a component. Does nothing if there is no component with that name.
	 * @param {string} name
	 */
	__removeComponent(name) {
		const component = this._components.get(name);
		if (component) {
			component.destroy();
		}
		this._components.delete(name);
	}

	/**
	 * Adds a component. Throws an Error if there is a component with that name or if the component's constructor throws an error.
	 * @template ComponentType
	 * @param {string} name
	 * @param {new (elem:string, ...) => ComponentType} ComponentType
	 * @param {string} elemId
	 * @param {...any} params
	 * @returns {ComponentType}
	 */
	__addComponent(name, ComponentType, elemId, ...params) {
		const component = this._components.get(name);
		if (component) {
			throw new Error('A component with the name ' + name + ' already exists.');
		}
		const newComponent = new ComponentType(this.elem.querySelector('#' + elemId), ...params);
		this._components.set(name, newComponent);
		return newComponent;
	}
}
