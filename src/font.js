import FontMetrics from 'fontmetrics';

export default class Font {
	/**
	 * Creates CSS variables about the metrics of the given font face that other CSS can use.
	 *
	 * The variables created are:
	 * * `--{prefix}-cap-height` - The relative height of the capital character.
	 * * `--{prefix}-x-height` - The relative height of the x character.
	 * * `--{prefix}-baseline` - The offset of the baseline.
	 *
	 * All vertical metrics are relative to the baseline.
	 * @param {string} fontFace - The face of the font.
	 * @param {string} prefix - The prefix for the variables.
	 */
	static createCSSVars(fontFace, prefix) {
		const metrics = FontMetrics({
			fontFamily: fontFace,
			// Optional (defaults)
			fontWeight: 'normal',
			fontSize: '100',
			origin: 'baseline'
		});
		const fontMetricsElem = document.createElement('style');
		fontMetricsElem.id = 'FontMetrics';
		fontMetricsElem.innerHTML = `
			:root {
				--` + prefix + `-cap-height: ${-metrics.capHeight};
				--` + prefix + `-x-height: ${-metrics.xHeight};
				--` + prefix + `-baseline: ${-metrics.baseline};
			}`;
		document.head.appendChild(fontMetricsElem);
	}
}
