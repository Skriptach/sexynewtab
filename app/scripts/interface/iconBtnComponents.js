'use strict';

; (() => {

	window.ActionBtn = class extends IconElement {
		constructor (type) {
			super(type);

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

	window.AccordBtn = class extends IconElement {
		constructor(type) {
			super(type);

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
	};

	customElements.define('accord-btn', AccordBtn);

})();
