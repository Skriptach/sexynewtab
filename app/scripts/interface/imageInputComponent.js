'use strict';

;(() => {

	class ImageInput extends ActionInput {
		constructor(){
			super('upload');

			this.input.type = 'file';
			this.input.accept = 'image/*';

			this.on('click', () => {
				this.input.click();
			});

			this.input.on('change', () => {
				const file = this.input.files[0];
				toBase64(file)
					.then((base64) => {
						const image = base64.length ? `url(${base64})` : null;
						chrome.runtime.sendMessage({
							action: 'loadBackground',
							image,
						});
					});
			});
		}
	}

	customElements.define('image-input', ImageInput);

})();