'use strict'

import gulp from 'gulp'
const $ = require('gulp-load-plugins')()
const BS = require('browser-sync').create()

const path = {
	dist: './dist/',
	lib: './lib/**/*.js',
	example: './example/',
}

function clean() {
	return gulp.src(path.dist)
	   .pipe($.clean({ force: true }))
	   .pipe(gulp.dest(path.dist))
}

function babelExamples() {
	return gulp.src([
		`${path.example}**/*.js`,
		`!${path.example}loader.min.js`,
		`!${path.example}promise.min.js`,
	])
		.pipe($.babel())
		.pipe(gulp.dest(path.example))
}

function build() {
	return gulp.src(path.lib)
		.pipe($.debug())
		.pipe($.concat("loader.js"))
		.pipe($.babel())
		.pipe(gulp.dest(path.dist))
		.pipe($.uglifyjs())
		.pipe($.rename("loader.min.js"))
		.pipe(gulp.dest(path.example))
		.pipe(gulp.dest(path.dist))
}

function watch() {
	gulp.watch(path.lib, build)
}

function server() {
	BS.init({
		server: {
			baseDir: path.example
		}
	})

	gulp.watch(path.example + '**/*', BS.reload)
}

gulp.task('clean', clean)
gulp.task('build', build)
gulp.task('build:examples', babelExamples)
gulp.task('watch', watch)
gulp.task('server', server)

gulp.task('start', gulp.series(['clean', 'build', 'build:examples']))
gulp.task('server', gulp.parallel(['start', 'server', 'watch']))
