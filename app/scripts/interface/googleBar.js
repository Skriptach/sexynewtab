'use strict';

;(() => {

	const ORIGIN1 = 'chrome-untrusted://new-tab-page';
	const ORIGIN2 = 'chrome://new-tab-page';

	function redirect (source) {
		const attr = source.nodeName === 'IFRAME' && source.src && source.src.includes(chrome.runtime.id) ? 'src'
			: source.nodeName === 'LINK' && source.href && source.href.includes(chrome.runtime.id) ? 'href'
			: null;
		if (!attr) {
			return;
		}
		const uri = new URL(source[attr]);
		const params = new URLSearchParams(uri.search);
		const paramOrigin = params.get('origin');
		if (paramOrigin && paramOrigin.includes(chrome.runtime.id)){
			const newParams = new URLSearchParams();
			newParams.append('origin', ORIGIN1);
			newParams.append('origin', ORIGIN2);
			Array.from(params)
				.filter(e => e[0] !== 'origin')
				.forEach(e => newParams.set(...e));
			uri.search = newParams.toString();
			source[attr] = uri.toString();
		}
	}

	function tweakNodes () {
		const {head} = document;

		const insertBefore = head.insertBefore;
		head.insertBefore = function (element, ref) {
			redirect(element);
			return insertBefore.call(this, element, ref);
		};

		const appendChild = HTMLElement.prototype.appendChild;
		HTMLElement.prototype.appendChild = function (element) {
			redirect(element);
			return appendChild.call(this, element);
		};

	}

	/* Remove due to change photo opens in iframe causing X-Frame-Options header restriction error */
	function removeChangeAvatar(bar) {
		const bigAvatar = bar.body.querySelector('.gbip');
		// if not loged in
		if (!bigAvatar) {
			return;
		}

		// remove change photo
		bigAvatar.nextElementSibling.remove();
	}

	function getProfileBar() {
		return new Fetcher(`https://www.google.com/async/newtab_ogb?hl=${navigator.language}`, true)
			.getBody()
			.then((response) => JSON.parse(response.body.replace(/^[^\n]*/, '')))
			.then((data) => {
				const hooks = {
					afterBarScript: data.update.ogb.page_hooks.after_bar_script.private_do_not_access_or_else_safe_script_wrapped_value,
					endOfBodyHtml: data.update.ogb.page_hooks.end_of_body_html.private_do_not_access_or_else_safe_html_wrapped_value,
					endOfBodyScript: data.update.ogb.page_hooks.end_of_body_script.private_do_not_access_or_else_safe_script_wrapped_value,
					inHeadScript: data.update.ogb.page_hooks.in_head_script.private_do_not_access_or_else_safe_script_wrapped_value,
					inHeadStyle: data.update.ogb.page_hooks.in_head_style.private_do_not_access_or_else_safe_style_sheet_wrapped_value,
				};
				const barHtml = data.update.ogb.html.private_do_not_access_or_else_safe_html_wrapped_value;
				const parser = new DOMParser();
				const doc = parser.parseFromString(barHtml, 'text/html');

				removeChangeAvatar(doc);
				return {hooks, bar: doc.body.children};
			});
	}

	function renderOneGoogleBarTheme() {
		if (!window.gbar) {
			return;
		}
		try {
			const oneGoogleBarApi = window.gbar.a;
			const oneGoogleBarPromise = oneGoogleBarApi.bf();
			oneGoogleBarPromise.then(oneGoogleBar => {
				const setForegroundStyle = oneGoogleBar.pc.bind(oneGoogleBar);
				setForegroundStyle(1);
			});
		} catch (err) {
			console.log('Failed setting OneGoogleBar theme');
		}
	}

	function injectStyle(hooks) {
		const inHeadStyle = document.createElement('style');
		inHeadStyle.type = 'text/css';
		inHeadStyle.appendChild(document.createTextNode(hooks.inHeadStyle));
		document.head.appendChild(inHeadStyle);
	}

	function inject(script) {
		// eslint-disable-next-line no-new-func
		const f = Function(script);
		f.apply(window);
	}

	function handleDashboard() {
		document.addEventListener('click', () => {
			const iframe = document.querySelector('iframe');
			if (iframe && iframe.parentElement && !iframe.parentElement.style.visibility) {
				const btn = document.querySelector('a[href*="/about/"][aria-expanded]');
				btn.click();
			}
		});
	}

	const ogElem = d('one-google');

	async function injectOneGoogleBar() {
		const ogb = await getProfileBar();
		injectStyle(ogb.hooks);
		inject(ogb.hooks.inHeadScript);

		renderOneGoogleBarTheme();

		ogElem.append(...ogb.bar);
		handleDashboard();
		ogElem.classList.add('show-element');

		inject(ogb.hooks.afterBarScript);

		d('one-google-end-of-body').innerHTML = ogb.hooks.endOfBodyHtml;
		inject(ogb.hooks.endOfBodyScript);
	}

	window.on('ready', () => {
		tweakNodes();
		injectOneGoogleBar();
	});

})();
