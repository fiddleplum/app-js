import Component from './component';

export default class SVG extends Component {
	/**
	 * Constructs an SVG.
	 * @param {Element} elem - The element inside which thee the component will reside.
	 */
	constructor(elem) {
		super(elem);

		/**
		 * The source.
		 * @type {string}
		 */
		this._src = elem.getAttribute('src');

		if (this._src !== null) {
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
	}
}

SVG.html = `
	`;
