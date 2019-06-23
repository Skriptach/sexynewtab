'use strict';

;(() => {

	window.toBase64 = function (blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader;
			reader.onerror = reject;
			reader.onload = () => {
				resolve(reader.result);
			};
			reader.readAsDataURL(blob);
		});
	};

})();