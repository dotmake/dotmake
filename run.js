
var Promise = require('bluebird');

var gulp = require('gulp');
var gulpJshint = require('gulp-jshint');

var promisifyGulpStream = require('./src/promisifyGulpStream');
var createMysqlInstance = require('./src/createMysqlInstance');

function codeIsJSHinted(src) {
    console.log('jsHinting!');

    return promisifyGulpStream(gulp.src(src).pipe(gulpJshint()).pipe(gulpJshint.reporter('default')));
}

// jshint('example/frontend/src/**/*.js').then(function (state) {
//     console.log('done!', state);
// });

createMysqlInstance().then(function (state) {
    console.log('done!', state);
});
