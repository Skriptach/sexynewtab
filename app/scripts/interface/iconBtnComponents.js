'use strict';

; (() => {

	window.ActionBtn = class ActionBtn extends IconElement {
		constructor () {
			super();

			this.label && (this.title = this.label);

			this.on('click', () => {
				this.dispatchEvent(new Event(this.type, { bubbles: true }));
			});

		}

		get type() {
			return super.type;
		}
		set type(newVal) {
			super.type = newVal;
			this.title = this.label;
		}
	};

	customElements.define('action-btn', ActionBtn);

	class AccordBtn extends IconElement {
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
