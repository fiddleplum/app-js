class App {
	/**
	 * Sets the subclass of App to be instantiated. It should be called in the main script outside of any function.
	 * @param {App} subclass
	 */
	static setAppSubclass(subclass) {
		App._subclass = subclass;
	}

	constructor() {
		window.app = this;
	}
}

/**
 * The subclass of App to be instantiated.
 * @type {App}
 * @private
 */
App._subclass = App;

document.addEventListener('DOMContentLoaded', () => {
	try {
		let app = new App._subclass();
	}
	catch (e) {
		console.error(e);
	}
});

export default App;
