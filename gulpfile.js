'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify-es').default;
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const newer = require('gulp-newer');
const jsonTransform = require('gulp-json-transform');
const zip = require('gulp-zip');

const paths = {
	locales: {
		src: 'app/_locales/**',
		dest: 'dist/_locales/',
	},
	icons: {
		src: 'app/icons/**',
		dest: 'dist/icons/',
	},
	fonts: {
		src: 'app/styles/fonts/**',
		dest: 'dist/styles/fonts/',
	},
	img: {
		src: 'app/styles/img/**',
		dest: 'dist/styles/img/',
	},
	interface: {
		src: 'app/layout.html',
		dest:'dist/'
	},
	background: {
		min: 'background.min.js',
		base: 'app/',
		dest: 'dist/scripts',
	},
	manifest: {
		src: 'app/manifest.json',
		dest: 'dist/',
	},
	zip: {
		src: 'dist/**/*',
		name: 'sexynewtab.zip',
		dest: './',
	}
};

function copyNewer (path) {
	return () => gulp.src(path.src)
		.pipe(newer(path.dest))
		.pipe(gulp.dest(path.dest));
}

function html () {
	return gulp.src(paths.interface.src)
		.pipe(useref())
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', less()))
		.pipe(gulpif('*.css', cleanCSS()))
		.pipe(gulpif('*.html', htmlmin({collapseWhitespace: true})))
		.pipe(gulp.dest(paths.interface.dest));
}

function manifest () {
	return gulp.src(paths.manifest.src)
		.pipe(jsonTransform((data, file) => {
			paths.background.src = data.background.scripts.map((filename) => `app/${filename}`);
			data.background.scripts = [`/scripts/${paths.background.min}`];
			return data;
		}))
		.pipe(gulp.dest(paths.manifest.dest));
}

function background () {
	return gulp.src(paths.background.src, {base: paths.background.base})
		.pipe(uglify())
		.pipe(concat(paths.background.min))
		.pipe(gulp.dest(paths.background.dest));
};


const build = gulp.series(
	html,
	copyNewer(paths.locales),
	copyNewer(paths.icons),
	copyNewer(paths.fonts),
	copyNewer(paths.img),
	manifest,
	background
);

gulp.task('build', build);
gulp.task('zip', () => {
	return gulp.src(paths.zip.src)
		.pipe(zip(paths.zip.name))
		.pipe(gulp.dest(paths.zip.dest));
});

gulp.task('pack', gulp.series('build', 'zip'));

gulp.task('default', build);

exports.default = build;
