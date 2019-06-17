'use strict';

;(() => {

	class ActionInput extends IconElement {
		constructor (type, action) {
			super(type);

			const input = document.createElement('input');
			this.appendChild(input);
			
			action = action || this.getAttribute('action');
			if (action) {
				this.action = action;
			}

		}

		get value() {
			return this.querySelector('input').value;
		}
		
		set action(newVal) {
			if (!newVal) {
				this._actBtn && this._actBtn.remove;
				this._actBtn = undefined;
			}
			this._actBtn = this._actBtn || new ActionBtn();
			this._actBtn.type = newVal;
			this.appendChild(this._actBtn);
		}
	}

	customElements.define('action-input', ActionInput);

	class URLInput extends ActionInput {
		constructor() {
			super('link');

			const input = this.querySelector('input');

			const triggerDone = () => {
				this.dispatchEvent(new Event('done', { bubbles: true }));
			};

			// use this setter for event to invoke setter and validator
			const setValue = () => {
				if (event.type === 'paste') {
					this.value = event.clipboardData.getData('text');
					return;
				}

				this.value = input.value;
			};

			const placeholder = this.getAttribute('placeholder') || 'https://link.to/your-favorite-site/page';
			input.setAttribute('placeholder', placeholder);
			const pattern = this.getAttribute('pattern') || '^https?:\\/\\/[\\w]+[-.\\w]+\\.[\\w]+(\\/.*)?';
			input.setAttribute('pattern', pattern);
			
			this._actBtn && this._actBtn.on('ok', triggerDone); // click
			input.on('change', setValue.bind(this));
			input.on('keyup', setValue.bind(this));
			input.on('paste', setValue.bind(this));
			this.on('keydown', () => {
				if (event.keyCode === 13) {
					triggerDone();
				}
			});
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
			if (this._actBtn){
				if (this.validity.valid) {
					this._actBtn.removeAttribute('disabled');
				} else {
					this._actBtn.setAttribute('disabled', '');
				}
			}
		}
	}

	customElements.define('url-input', URLInput);
})();
