'use strict';

;(() => {

	window.presets = {
		cosmos: [
			'Nebula',
			'Aurora',
			'Galaxy',
			'Milky Way',
			'Night,Sky',
			'Stars',
			'Universe',
		],
		sky: [
			'Sky',
			'Blue Sky',
			'Big Sky',
			'Dramatic Sky',
			'Dusk',
			'Dawn',
			'Red Sky',
			'Sunray',
			'Sunrise',
			'Sunset',
			'Clouds',
			'Cloudy',
			'Cloudscape',
			'Sunny,Sky',
			'Heaven',
		],
		stormy: [
			'Thunderstorm',
			'Lightning',
			'Storm',
			'Stormy',
		],
		girls: [
			'Bikini,Girl',
			'Bikini,Women',
			'Bikini,Female',
			'Bra,Girl',
			'Bra,Women',
			'Bra,Female',
			'Booty',
			'Girl,Underwear',
			'Girl,Model',
			'Nude',
			'Sensual',
			'Sexy Girl',
			'Swimwear,Girl',
			'Swim Wear,Girl',
			'Swimming Sute,Girl',
			'Summer,Girl',
			'Women,Underwear',
			'Women,Model',
		],
		shore: [
			'Bay',
			'Beach',
			'Beach,Sea',
			'Coast',
			'Coast,Beach',
			'Summer,Beach',
			'Swimming,Beach',
			'Tropical,Beach',
			'Tropical,Bay',
			'Shore',
			'Shoreline',
			'Laguna',
			'Surfing',
		],
		marine: [
			'Aquatic',
			'Aquarium',
			'Coral',
			'Coral Reef',
			'Diving',
			'Scuba Diving',
			'Dolphins',
			'Sea Life',
			'Manta ray',
			'Marine life',
			'Reef',
			'Jellyfish',
			'Turtle',
			'Sea Turtle',
			'Deep Sea',
			'Deep Ocean',
			'Deep Water',
			'Under Sea',
			'Under Ocean',
			'Under Water',
			'Underwater',
			'Under Water Life',
			'Whale',

		],
	};

	const currentBg = [];

	function save(preset, image) {
		const entry = {};
		entry[preset] = image;
		chrome.storage.local.set(entry);
		return {preset, image};
	}

	function generateCosmosUrl (width, height, preset) {
		if (!presets[preset]){
			throw new Error(`Preset ${preset} is undefined`);
		}
		const r = Math.floor(Math.random() * presets[preset].length);
		const url = `https://source.unsplash.com/${width}x${height}?${presets[preset][r]}`;
		return loadImage(url, false, true)
			.then(image => `url(${image.dataUrl})`)
			.then(image => save(preset, image))
			.then(bg => initBg(bg, width, height));
	};

	window.initBg = function (bg, w = 1920, h = 1080) {
		if (bg && bg.image){
			currentBg[bg.preset] = bg.image;
			return Promise.resolve();
		}

		return generateCosmosUrl(w, h, bg.preset);
	};

	window.getBg = function (w, h, preset) {
		return (generateCosmosUrl(w, h, preset), currentBg[preset]);
	};

})();
