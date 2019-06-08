'use strict';

;(() => {

	const template = d('x-thumb');

	class ThumbLink extends HTMLAnchorElement {
		constructor () {
			super();

			if (!this.children.length) {
				const content = template.content.cloneNode(true);
				this.appendChild(content);
			}

			this.on('click', () => {
				const page = event.target.closest('.page');
				if (page.classList.contains('inactive')) {
					event.target.dispatchEvent(new Event('edit', { bubbles: true }) );
					return;
				}

				if (FLOW && !page.classList.contains('current')) {
					event.preventDefault();
					if (event.button !== 0) { return; }
					flowTo(page);
				} else {
					if (event.button !== 0) { return; }
					page.classList.add('full');
				}
			});

		}
	}

	customElements.define('thumb-link', ThumbLink, { extends: 'a' } );

})();
