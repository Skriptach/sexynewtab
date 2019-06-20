'use strict';

;(() => {

	class ActionInput extends IconElement {
		constructor (type, action) {
			super(type);

			this.input = document.createElement('input');
			this.appendChild(this.input);

			action = action || this.getAttribute('action');
			if (action) {
				this.action = action;
			}

		}

		get value() {
			return this.input.value;
		}

		set value(newVal = '') {
			const oldVal = this.input.title;
			this.input.value = newVal;
			this.input.title = this.input.value;
			this._onbeforechange();
			this.input.value !== oldVal && this.dispatchEvent(new Event('change', { bubbles: true }));
		}

		set action(newVal) {
			if (!newVal) {
				this._actBtn && this._actBtn.remove;
				this._actBtn = null;
			}
			this._actBtn = this._actBtn || new ActionBtn();
			this._actBtn.type = newVal;
			this.appendChild(this._actBtn);
		}

		_bindChange() {
			const setValue = () => {
				if (event.type === 'paste') {
					event.preventDefault();
					this.value = event.clipboardData.getData('text');
					return;
				}

				this.value = this.input.value;
			};

			this.input.on('paste', setValue.bind(this));
			this.input.on('keyup', setValue.bind(this));
			this.input.on('change', setValue.bind(this));
		}

		_onbeforechange (){}
	}

	customElements.define('action-input', ActionInput);

	class URLInput extends ActionInput {
		constructor() {
			super('link');
			this._bindChange();

			const triggerDone = () => {
				this.dispatchEvent(new Event('done', { bubbles: true }));
			};

			const placeholder = this.getAttribute('placeholder') || 'https://link.to/your-favorite-site/page';
			this.input.setAttribute('placeholder', placeholder);
			const pattern = this.getAttribute('pattern') || '^https?:\\/\\/[\\w]+[-.\\w]+\\.[\\w]+(\\/.*)?';
			this.input.setAttribute('pattern', pattern);

			this._actBtn && this._actBtn.on('ok', triggerDone); // click
			this.on('keydown', () => {
				if (event.keyCode === 13) {
					triggerDone();
				}
			});
		}

		get validity () {
			return this.input.validity;
		}

		_onbeforechange () {
			this.validate();
			if (!event || event.type !== 'keyup'){
				setTimeout(() => {
					this.input.select();
				}, 10);
			}
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

	class SearchInput extends ActionInput {
		constructor() {
			super('search', 'clear');
			this._bindChange();

			this._actBtn.on('click', () => {
				this.value = '';
				this.input.focus();
			});
		}

	}

	customElements.define('search-input', SearchInput);

})();
