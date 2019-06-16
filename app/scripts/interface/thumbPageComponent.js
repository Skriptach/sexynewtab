'use strict';

;(() => {

	const template = d('x-page');

	class ThumbPage extends HTMLElement {
		constructor (index = 0, col = 0, row = 0) {
			super();

			const content = template.content.cloneNode(true);
			this.appendChild(content);

			this.draggable = true;
			this.index = index;
			this.setAttribute('id', `page${index}`);
			this.setAttribute('data-col', col);
			this.setAttribute('data-row', row);
			this.classList.add('inactive');
			
		}

		clear () {
			this.style.setProperty('--fav-image', null);
			this.style.setProperty('--fav-mask', null);
			this.style.setProperty('--fav-color', null);
			this.style.setProperty('--thumb-image', null);
		}

		remove () {
			const page = this;
			page.querySelector('a').removeAttribute('href');
			page.style.webkitTransform = 'scale(0.3)';
			this.classList.remove('loading');
			setTimeout(() => {
				page.classList.add('inactive');
				if (FLOW) {
					if (page === first_flow_page) {
						first_flow_page = getFirstPage();
					}
					page.classList.add('deleting');
					flowTo(getPage('next') || getPage('previous'));
					setTimeout(() => page.classList.remove('deleting'), 500);
				}
				page.clear();
				page.style.webkitTransform = 'scale(1)';
				setTimeout(() => { page.style.webkitTransform = ''; }, 10);
			}, 200);
		}

		update (thumb) {
			this.classList.remove('loading');
			const oldUrl = this.url;
			this.url = slotsList[this.index] ? slotsList[this.index].url : '';
			this.thumb = thumb ? thumb :
				slotsList[this.index] && slotsList[this.index].thumb ? slotsList[this.index].thumb :
				(oldUrl === this.url) ? this.thumb : '';

			if (this.url) {
				this.querySelector('a').setAttribute('href', this.url);
				this.classList.remove('inactive');
				if (!this.thumb) {
					const isVector = !!slotsList[this.index].favicon.color;
					const url = slotsList[this.index].favicon.dataUrl;
					this.style.setProperty('--fav-image', isVector ? null : `url("${url}")`);
					this.style.setProperty('--fav-mask', isVector ? `url("${url}")` : null);
					this.style.setProperty('--fav-color', isVector ? slotsList[this.index].favicon.color || '#FFF' : null);
				}
				this.style.setProperty('--thumb-image', this.thumb ? `url("${this.thumb}")` : null);
			}
		}

		loading () {
			this.clear();
			this.classList.remove('inactive');
			this.classList.add('loading');
		}
	};
	
	window.ThumbPage = ThumbPage;
	customElements.define('thumb-page', ThumbPage);
})();
