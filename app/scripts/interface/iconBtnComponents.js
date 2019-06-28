'use strict';

; (() => {

	window.ActionBtn = class extends IconElement {
		#dispatch = () => {
			this.dispatchEvent(new Event(this.type, { bubbles: true }));
		}

		constructor (type) {
			super(type);

			this.label && (this.title = this.label);

			this.on('click', this.trigger );

		}

		get trigger() {
			return this.#dispatch;
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

	class ToggleBtn extends ActionBtn {
		constructor() {
			super();

			this.on('mousedown', this.toggle.bind(this));

			this.off('click', this.trigger);
		}

		toggle() {
			const isActive = this.classList.contains('active');
			isActive ? this.turnOff() : this.turnOn();
			this.trigger();
		}

		turnOn() {
			this.classList.add('active');
			this.dispatchEvent(new Event('active', { bubbles: true }));
		}

		turnOff() {
			this.classList.remove('active');
			this.dispatchEvent(new Event('disactive', { bubbles: true }));
		}
	}

	customElements.define('toggle-btn', ToggleBtn);

})();
