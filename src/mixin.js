
export default class Mixin {
	constructor(baseClass, ...mixins) {
		const combined = class _Combined extends baseClass {
			constructor(...args) {
				super(...args);
				mixins.forEach((mixin) => {
					mixin.prototype.constructor.call(this);
				});
			}
		};
		mixins.forEach((mixin) => {
			Mixin._copyProps(combined.prototype, mixin.prototype);
			Mixin._copyProps(combined, mixin);
		});
		return combined;
	}

	static _copyProps(target, source) {
		let properties = Object.getOwnPropertyNames(source);
		properties = properties.concat(Object.getOwnPropertySymbols(source));
		properties.forEach((property) => {
			if (property.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) {
				return;
			}
			Object.defineProperty(target, property, Object.getOwnPropertyDescriptor(source, property));
		});
	}
}
