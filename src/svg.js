import Component from './component';

export default class SVG extends Component {
	/**
	 * Constructs an SVG.
	 * @param {Object<string, string>} [attributes] - The attributes passed as if it were <Component attrib=''...>
	 */
	constructor(attributes) {
		super();

		/**
		 * The source.
		 * @type {string}
		 * @private
		 */
		this._src = attributes.src;

		if (this._src !== undefined) {
			this._update();
		}
	}

	get src() {
		return this._src;
	}

	set src(src) {
		if (this._src !== src) {
			this._src = src;
			this._update();
		}
	}

	_update() {
		fetch(this._src).then(response => response.text()).then((text) => {
			// Parse the text into an svg element.
			const template = document.createElement('template');
			template.innerHTML = text.trim();
			if (template.content.children.length !== 1 || !(template.content.firstElementChild instanceof SVGElement)) {
				throw new Error('SVG Source is not a vald .svg file.');
			}
			const svg = template.content.firstElementChild;
			// Remove the old children.
			const rootElement = this.__getElement('svg');
			while (rootElement.lastChild !== null) {
				rootElement.removeChild(rootElement.lastChild);
			}
			// Copy over the viewbox.
			rootElement.setAttribute('viewBox', svg.getAttribute('viewBox'));
			// Copy over the children.
			while (svg.firstChild !== null) {
				rootElement.appendChild(svg.firstChild);
			}
		});
	}
}

SVG.html = `<svg ref="root"></svg>
	`;
