'use strict';

; (() => {

	class IconBtn extends HTMLElement {
		constructor () {
			super();

			const type = this.getAttribute('type');
			this.title = chrome.i18n.getMessage(type);
			this.classList.add(type);
			this.innerHTML = `<i class="st-${type}"></i>`;

			this.addEventListener('click', () => {
				this.dispatchEvent( new Event(type, { bubbles: true }) );
			});

		}
	}

	customElements.define('icon-btn', IconBtn);

})();
