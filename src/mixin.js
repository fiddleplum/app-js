/** @module pioneer-js */

/**
 * A generic mixin class. You use it by doing MyClass extends new Mixin(BaseClass, MixinClass1, MixinClass2).
 * The mixins can't take any constructor arguments.
 * @template BaseClass
 * @param {BaseClassConstructor<BaseClass>} baseClass
 */
export default class Mixin {
	constructor(baseClass, ...mixins) {
		const combined = class _Combined extends baseClass {
			constructor(...args) {
				super(...args);
				for (const mixin of mixins) {
					// eslint-disable-next-line new-parens, new-cap
					Mixin._copyProps(this, new mixin);
				}
			}
		};
		for (const mixin of mixins) {
			Mixin._copyProps(combined.prototype, mixin.prototype);
			Mixin._copyProps(combined, mixin);
		};
		return combined;
	}

	static _copyProps(target, source) {
		let properties = Object.getOwnPropertyNames(source);
		properties = properties.concat(Object.getOwnPropertySymbols(source));
		for (const property of properties) {
			if (property.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) {
				continue;
			}
			Object.defineProperty(target, property, Object.getOwnPropertyDescriptor(source, property));
		}
	}
}

/**
 * @template BaseClass
 * @callback ItemConstructor
 * @returns {BaseClass}
 */
