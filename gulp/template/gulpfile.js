/* File: gulpfile.js */

/**************************************************
 * modules laod
 *************************************************/
var gulp  = require('gulp');

var sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	cleanCSS = require('gulp-clean-css'),
	stripCssComments = require('gulp-strip-css-comments');
	
var imagemin = require('gulp-imagemin');
	imageminPngquant = require('imagemin-pngquant');
	
var uglify = require('gulp-uglify');
	
var	glob = require('glob'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	es = require('event-stream'),
	strip = require('gulp-strip-comments');

var gutil = require('gulp-util'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	rename = require("gulp-rename"),
	newer = require('gulp-newer'),
	del = require('del'),
	path = require('path'),
	basename = require('basename'),
	htmlmin = require('gulp-htmlmin'),
	assign = require('lodash.assign');

var browserSync = require('browser-sync').create(),
    reload = browserSync.reload;
	
/**************************************************
 * path
 *************************************************/
var cssSrcPath        = './src/scss';
var cssDestPath       = './css';
var jsSrcPath         = './src/js';
var jsDestPath        = './js';
var scssPath          = './src/scss';
var bootstrapScssPath = './bootstrap/assets/stylesheets';

/**************************************************
 * tasks
 *************************************************/
/**** Concatenate & Minify Sass ****/
gulp.task('sass', function () {
	var processors = [
		autoprefixer({
			browsers:['last 2 versions'],
			cascade: true,
			remove: true
		})
    ];
	return gulp.src(['./src/scss/**/*.scss'])
		.pipe(sourcemaps.init())
		.pipe(rename({ 
			suffix: '.min'
		}))
		.pipe(newer({
            dest: './dist/css',
            ext: '.css'
        }))
		.pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
		.pipe(postcss(processors))	
		.pipe(cleanCSS({
            advanced: false,
            keepBreaks: false,
            keepSpecialComments: '1'
        }))
		.pipe(stripCssComments({preserve: false}))
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('./dist/css'))
		.pipe(reload({stream: true}));
});

/**** Minify Image ****/
gulp.task('imagemin', function () {
	return gulp.src('./src/images/**/*.{png,jpg,gif,ico}')
		.pipe(newer('./dist/images'))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [imageminPngquant()]
		}))
		.pipe(gulp.dest('./dist/images'));
});

/**** Concatenate & Minify JS ****/
gulp.task('browserify', function(done) {
	glob('src/js/*.js', function(err, files) {
		if(err) done(err);
		var tasks = files.map(function(entry) {
			var customOpts = {
				entries: [entry],
                extensions: ['.js'],
                debug: true,
                cache: {},
                packageCache: {},
                fullPaths: true
			};
			var opts = assign({}, watchify.args, customOpts);
			var b = watchify(browserify(opts));
			var bundle = function() {
				return b.bundle()
					.pipe(source(entry))
					.pipe(buffer())
					.pipe(sourcemaps.init())
					.pipe(uglify())
					.pipe(rename({ 
						suffix: '.min',
						dirname: 'dist/js'
					}))
					/*
					.pipe(newer({
						dest: './dist/js',
						ext: '.js'
					}))
					*/
					.pipe(sourcemaps.write())
					.pipe(gulp.dest('./'))
					.pipe(reload({stream: true}));
			};
			b.on('update', bundle);
			b.on('log',gutil.log);
			return bundle();
		});
		es.merge(tasks).on('end', done);
	});
});

/**** Minify HTML ****/
gulp.task('minify', function() {
	var options = {
        removeComments: true,
        collapseWhitespace: false,
        collapseBooleanAttributes: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyJS: true,
        minifyCSS: true
    };
	return gulp.src('src/**/*.html')
	.pipe(newer('./dist'))
	.pipe(htmlmin(options))
    .pipe(gulp.dest('./dist'))
	.pipe(reload({stream: true}));
});

/**** Watch Files For Changes ****/
gulp.task('watch', function() {
	gulp.watch('src/scss/**/*.scss', ['sass']).on('change', function (event) {
		if (event.type === 'deleted'){
            del(['./dist/css/'+path.basename(event.path, '.scss')+'.*']);      
		}
	});
	gulp.watch('src/images/**/*.{png,jpg,gif,ico}', ['imagemin']).on('change', function (event) {
		if (event.type === 'deleted'){
			del.sync(path.resolve('dist', path.relative(path.resolve('src'), event.path)));
		}
	});
	gulp.watch('src/js/*.js', ['browserify']).on('change', function (event) {
		if (event.type === 'deleted'){
            del(['./dist/js/'+path.basename(event.path, '.js')+'.*']);      
		}
	});
	gulp.watch('src/**/*.html', ['minify']).on('change', function (event) {
		if (event.type === 'deleted'){
			del.sync(path.resolve('dist', path.relative(path.resolve('src'), event.path)));
		}
	});
	
});

/**** Default Task ****/
gulp.task('default', ['sass', 'imagemin', 'browserify', 'minify', 'watch'], function(){
	browserSync.init({
		port: 3000,
        server: {
            baseDir: './dist',
			routes: {
                '/src':  'src'
            },
			index: 'index.html'
        }
    });
});