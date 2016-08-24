'use strict'

import gulp from 'gulp'
const $ = require('gulp-load-plugins')()

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

function build() {
	return gulp.src(path.lib)
		.pipe($.debug())
		.pipe($.concat("loader.js"))
		.pipe($.babel())
		.pipe(gulp.dest(path.dist))
		.pipe(gulp.dest(path.example))
		.pipe($.uglifyjs())
		.pipe($.rename("loader.min.js"))
		.pipe(gulp.dest(path.dist))
}

function watch() {
	gulp.watch(path.lib, build)
}

gulp.task('clean', clean)
gulp.task('build', build)
gulp.task('watch', watch)
gulp.task('start', gulp.series(['clean', 'build', 'watch']))
