'use strict';

; (() => {

	window.IconElement = class extends HTMLElement {
		#type = null;
		constructor(type) {
			super();

			type = type || this.getAttribute('type');
			type && (this.type = type);
		}

		get type() {
			return this.#type;
		}

		set type(newVal) {
			this.classList.remove(`st-${this.#type}`);

			this.#type = newVal;
			this.setAttribute('type', newVal);
			this.label = chrome.i18n.getMessage(newVal);

			this.classList.add(`st-${newVal}`);
		}

	};

})();
