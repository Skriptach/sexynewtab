'use strict';

; (() => {

	class IconBtn extends HTMLElement {
		connectedCallback () {

			const type = this.getAttribute('type');
			this.title = chrome.i18n.getMessage(type);
			this.classList.add(type);
			this.innerHTML = `<i class="st-${type}"></i>`;

			this.on('click', () => {
				this.dispatchEvent( new Event(type, { bubbles: true }) );
			});

		}
	}

	customElements.define('icon-btn', IconBtn);

})();
