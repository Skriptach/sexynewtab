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

	class AccordBtn extends IconBtn {
		constructor () {
			super();

			const label = document.createElement('span');
			label.innerText = this.label;
			this.appendChild(label);
			this.on('click', () => {
				this.parentElement.scroll({
					top: this.nextElementSibling.offsetTop - this.offsetHeight - this.computedStyleMap().get('top').value,
					behavior: 'smooth'
				});
			});
		}
	}

	customElements.define('accord-btn', AccordBtn);

})();
