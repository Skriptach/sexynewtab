'use strict';

module.exports = function (grunt) {

	require('time-grunt')(grunt);

	// Automatically load required Grunt tasks
	require('jit-grunt')(grunt, {
		useminPrepare: 'grunt-usemin',
		replace: 'grunt-text-replace',
		zip: 'grunt-zip'
	});

	// Configurable paths for the application
	var appConfig = {
		app: 'app',
		dist: 'dist'
	};

	// Define the configuration for all the tasks
	grunt.initConfig({

		// Project settings
		sexy: appConfig,

		// Empties folders to start fresh
		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'<%= sexy.dist %>/{,*/}*',
						'!<%= sexy.dist %>/.git{,*/}*'
					]
				}]
			},
			pack: {
				files: [{
					src: ['sexynewtab.zip']
				}]
			}
		},

		// Renames files for browser caching purposes
		filerev: {
			dist: {
				src: [
					'<%= sexy.dist %>/scripts/{,*/}*.js',
					'<%= sexy.dist %>/styles/{,*/}*.css',
					'<%= sexy.dist %>/icons/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
					'<%= sexy.dist %>/styles/fonts/*'
				]
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them
		useminPrepare: {
			html: '<%= sexy.app %>/layout.html',
			options: {
				dest: '<%= sexy.dist %>',
				flow: {
					html: {
						steps: {
							js: ['concat', 'uglifyjs'],
							css: ['cssmin']
						},
						post: {}
					}
				}
			}
		},

		// Performs rewrites based on filerev and the useminPrepare configuration
		usemin: {
			html: ['<%= sexy.dist %>/{,*/}*.html'],
			css: ['<%= sexy.dist %>/styles/{,*/}*.css'],
			js: ['<%= sexy.dist %>/scripts/{,*/}*.js'],
			options: {
				assetsDirs: [
					'<%= sexy.dist %>',
					'<%= sexy.dist %>/icons',
					'<%= sexy.dist %>/styles'
				],
				patterns: {
					js: [[/(icons\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))/g, 'Replacing references to images']]
				}
			}
		},

		cssmin: {
			dist: {
				files: {
					'<%= sexy.dist %>/styles/main.css': [
						'<%= sexy.app %>/styles/main.css'
					],
					'<%= sexy.dist %>/styles/themes.css': [
						'<%= sexy.app %>/styles/themes.css'
					],
					'<%= sexy.dist %>/styles/fonts/fontello.css': [
						'<%= sexy.app %>/styles/fonts/fontello.css'
					]
				}
			}
		},
		uglify: {
			dist: {
				files: {
					'<%= sexy.dist %>/scripts/interface.js': [
						'<%= sexy.app %>/scripts/interface.js'
					],
					'<%= sexy.dist %>/scripts/back.js': [
						'.tmp/scripts/back.js'
					]
				}
			}
		},
		concat: {
			dist: {
				files: {
					'.tmp/scripts/back.js': [
						'<%= sexy.app %>/scripts/MD5.js',
						'<%= sexy.app %>/scripts/favicon.js',
						'<%= sexy.app %>/scripts/background.js'
					],
				}
			}
		},

		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= sexy.app %>/icons',
					src: '{,*/}*.{png,jpg,jpeg,gif}',
					dest: '<%= sexy.dist %>/icons'
				}, {
					expand: true,
					cwd: '<%= sexy.app %>/styles',
					src: '{,*/}*.{png,jpg,jpeg,gif}',
					dest: '<%= sexy.dist %>/styles'
				}]
			}
		},

		svgmin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= sexy.app %>/icons',
					src: '{,*/}*.svg',
					dest: '<%= sexy.dist %>/icons'
				}]
			}
		},

		htmlmin: {
			dist: {
				options: {
					collapseWhitespace: true,
					conservativeCollapse: true,
					collapseBooleanAttributes: true
				},
				files: [{
					expand: true,
					cwd: '<%= sexy.dist %>',
					src: ['*.html'],
					dest: '<%= sexy.dist %>'
				}]
			}
		},

		// Copies remaining files to places other tasks can use
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= sexy.app %>',
					dest: '<%= sexy.dist %>',
					src: [
						'*.{ico,png,txt}',
						'*.html',
						'icons/{,*/}*.{webp}',
						'_locales/*/*',
						'styles/fonts/{,*/}*.*'
					]
				}, {
					expand: true,
					cwd: '.tmp/icons',
					dest: '<%= sexy.dist %>/icons',
					src: ['generated/*']
				}]
			},
			styles: {
				expand: true,
				cwd: '<%= sexy.app %>/styles',
				dest: '.tmp/styles/',
				src: '{,*/}*.css'
			}
		},

		replace: {
			dist: {
				src: ['<%= sexy.app %>/manifest.json'],             // source files array (supports minimatch) 
				dest: '<%= sexy.dist %>/',             // destination directory or file 
				replacements: [{
					from: '"scripts/MD5.js", "scripts/favicon.js", "scripts/background.js"',                   // string replacement 
					to: '"scripts/back.js"'
				}]
			}
		},

		// Run some tasks in parallel to speed up the build process
		concurrent: {
			dist: [
				'copy:styles',
				'imagemin',
				'svgmin'
			]
		},

		zip: {
			'dist': {
				router: function (filepath) {
					console.log(filepath);
					return filepath.replace('dist', 'sexynewtab');
				},
				src: ['<%= sexy.dist %>/**/*'],
				dest: 'sexynewtab.zip',
				compression: 'DEFLATE'
			}
		}
	});

	grunt.registerTask('build', [
		'clean:dist',
		'useminPrepare',
		'concurrent:dist',
		'concat',
		'copy:dist',
		'cssmin',
		'uglify',
		'usemin',
		'replace',
		'htmlmin'
	]);

	grunt.registerTask('pack', [
		'clean:pack',
		'build',
		'zip'
	]);

	grunt.registerTask('default', [
		'build'
	]);

};
