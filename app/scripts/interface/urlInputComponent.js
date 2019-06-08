'use strict';

;(() => {

	const template = d('x-url-input');

	class URLInput extends HTMLElement {
		constructor() {
			super();

			const content = template.content.cloneNode(true);
			const button = content.querySelector('button');
			const input = content.querySelector('input');

			const triggerOk = () => {
				this.dispatchEvent(new Event('ok', { bubbles: true }));
			};

			// use this setter for event to invoke setter and validator
			const setValue = () => {
				if (event.type === 'paste') {
					this.value = event.clipboardData.getData('text');
					return;
				}

				this.value = input.value;
			};

			const placeholder = this.getAttribute('placeholder');
			if (this.getAttribute('placeholder') !== null) {
				input.setAttribute('placeholder', placeholder);
			}
			if (this.getAttribute('ok-button') === null) {
				this._isOkButton = false;
				button.remove();
			} else {
				this._isOkButton = true;
				button.on('click', triggerOk);
			}
			
			input.on('change', setValue.bind(this));
			input.on('keyup', setValue.bind(this));
			input.on('paste', setValue.bind(this));
			this.on('keydown', () => {
				if (event.keyCode === 13) {
					triggerOk();
				}
			});
			
			this.appendChild(content);
		}

		get validity () {
			return this.querySelector('input').validity;
		}

		get value () {
			return this.querySelector('input').value;
		}

		set value (newVal = '') {
			const input = this.querySelector('input');
			const oldVal = input.title;
			input.value = newVal;
			input.title = input.value;
			this.validate();
			if (!event || event.type !== 'keyup'){
				input.select();
			}
			input.value !== oldVal && this.dispatchEvent(new Event('change', { bubbles: true }));
		}

		validate () {
			if (this._isOkButton){
				if (this.validity.valid) {
					this.querySelector('button').removeAttribute('disabled');
				} else {
					this.querySelector('button').setAttribute('disabled', '');
				}
			}
		}
	}

	customElements.define('url-input', URLInput);
})();
