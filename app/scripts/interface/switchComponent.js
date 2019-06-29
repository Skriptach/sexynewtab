'use strict';

;(() => {

	function getSettings(btn) {
		const classList = btn.closest('switch-panel').classList;
		return classList.contains('background') ? back.settings.BACK_TYPE :
			classList.contains('thumb') ? back.settings.THUMB_TYPE : '';
	}

	class SwitchBtn extends HTMLElement {
		constructor(){
			super();

			this.type = this.getAttribute('type');
			if (this.type === getSettings(this)){
				this.turnOn();
			}
			this.on('mousedown', this.turnOn.bind(this));
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

	class SwitchControls extends HTMLElement {
		#current;
		constructor(){
			super();

			this.#current = this.querySelector('.active');
			this.setAttribute('current', this.#current.type);

			this.on('active', () => {
				if (this.#current === event.target) {
					return;
				}
				this.#current && this.#current.turnOff();
				this.#current = event.target;
				this.setAttribute('current', this.#current.type);

				this.dispatchEvent(new Event('switch', { bubbles: true }));
			});
		}

		get type() {
			return this.#current.type;
		}
	}

	window.on('ready', () => {
		customElements.define('switch-btn', SwitchBtn);
		customElements.define('switch-controls', SwitchControls);
	});

})();
