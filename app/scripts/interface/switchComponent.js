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

			this.tab = this.getAttribute('tab');
			if (this.tab === getSettings(this)){
				this.turnOn();
			}
			this.on('mousedown', this.turnOn.bind(this));
		}

		turnOn() {
			this.classList.add('active');
			this.dispatchEvent(new Event('active', { bubbles: true }));
			this.allowTab();
		}

		turnOff() {
			this.classList.remove('active');
			this.dispatchEvent(new Event('disactive', { bubbles: true }));
		}

		allowTab() {
			const tabElement = this.closest('switch-panel').querySelectorAll('switch-tabs [tab]');
			Array.prototype.forEach.call(tabElement, (element) => {
				(element.input || element).tabIndex = element.getAttribute('tab') === this.tab ? 0 : -1;
			});
		}
	}

	class SwitchControls extends HTMLElement {
		#current;
		constructor(){
			super();

			this.#current = this.querySelector('.active');
			this.setAttribute('current', this.#current.tab);

			this.on('active', () => {
				if (this.#current === event.target) {
					return;
				}
				this.#current && this.#current.turnOff();
				this.#current = event.target;
				this.setAttribute('current', this.#current.tab);

				this.dispatchEvent(new Event('switch', { bubbles: true }));
			});
		}

		get type() {
			return this.#current.tab;
		}
	}

	window.on('ready', () => {
		customElements.define('switch-btn', SwitchBtn);
		customElements.define('switch-controls', SwitchControls);
	});

})();
