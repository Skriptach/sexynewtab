'use strict';

; (() => {

	class IconBtn extends HTMLElement {
		constructor () {
			super();

			this.type = this.getAttribute('type');
			this.label = chrome.i18n.getMessage(this.type);
			this.innerHTML = `<i class="st-${this.type}"></i>`;

		}
	}

	customElements.define('icon-btn', IconBtn);
	
	class ActionBtn extends IconBtn {
		constructor () {
			super();

			this.title = this.label;
			this.classList.add(this.type);

			this.on('click', () => {
				this.dispatchEvent(new Event(this.type, { bubbles: true }));
			});

		}
	}

	customElements.define('action-btn', ActionBtn);

})();
