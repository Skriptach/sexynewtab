'use strict';

;(() => {

	let isDragover;

	function isImage (item) {
		return (/image\/.+/).test(item.type);
	}

	function hasImage() {
		const items = Array.from(event.dataTransfer.items);
		return (event.dataTransfer.types.includes('Files') && items.find(isImage));
	}

	function getImage() {
		return Array.from(event.dataTransfer.files).find(isImage);
	}

	function off() {
		isDragover = false;
		document.body.classList.remove('dragover');
		document.off('dragleave', off);
		document.off('drop', drop);
	}

	function drop() {
		const file = getImage();
		if (hasImage() && file) {
			event.preventDefault();
			uploadBgImage(file);
			$('[tab="IMAGE"]')[0].turnOn();
			off();
		}
	}

	document.on('dragover', () => {
		if (hasImage()) {
			event.preventDefault();
		}
	});

	document.on('dragenter', () => {
		if (isDragover) {
			return;
		}

		if (hasImage()) {
			document.body.classList.add('dragover');
			isDragover = true;

			setTimeout(() => {
				document.on('dragleave', off);
				document.on('drop', drop);
			}, 10);
		}

	});

})();

