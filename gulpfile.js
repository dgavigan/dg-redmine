var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var concat = require('gulp-concat');






gulp.task('build', [], function(){
	return gulp.src([
		'./bower_components/localforage/dist/localforage.js',
		'./bower_components/angular-localforage/dist/angular-localForage.js',
		'./src/dg-redmine.js'])
		.pipe(concat('dg-redmine.js'))
		.pipe(gulp.dest('./dist/'));
})




gulp.task('default', [], function(cb){
	runSequence('build', cb)
});


