import Component from './component';

export default class Icon extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super();

		/**
		 * The source.
		 * @type {string}
		 * @private
		 */
		this._src = '';

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
				throw new Error('The source ' + this._src + ' is not a vald .svg file.');
			}
			const svg = template.content.firstElementChild;
			// Remove the old children.
			const rootElement = this.__element('root');
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

Icon.html = `<svg ref="root"></svg>`;

