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
				uploadBgImage(this.input.files[0]);
			});
		}
	}

	customElements.define('image-input', ImageInput);

})();
