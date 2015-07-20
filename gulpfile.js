'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var paths = {
    lint: ['./gulpfile.js', './server.js', './controllers/**/*.js', './errors/**/*.js', './lib/**/*.js', './utils/**/*.js'],
    watch: ['./gulpfile.js', './server.js', './routes.js', './test/**/*.js', '!test/{temp,temp/**}', './controllers/**/*.js', './errors/**/*.js', './lib/**/*.js', './utils/**/*.js'],
    tests: ['./test/**/*.js', '!test/{temp,temp/**}'],
    source: ['server.js']
};

var plumberConf = {};

if (process.env.CI) {
    plumberConf.errorHandler = function (err) {
        throw err;
    };
}

gulp.task('lint', function () {
    return gulp.src(paths.lint)
        .pipe(plugins.jshint('.jshintrc'))
        .pipe(plugins.plumber(plumberConf))
        .pipe(plugins.jscs())
        .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('istanbul', function (cb) {
    gulp.src(paths.source)
        .pipe(plugins.istanbul()) // Covering files
        .pipe(plugins.istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            gulp.src(paths.tests)
                .pipe(plugins.plumber(plumberConf))
                .pipe(plugins.lab('-v -C -l -m 0'))
                .pipe(plugins.istanbul.writeReports()) // Creating the reports after running tests
                .on('finish', function () {
                    process.chdir(__dirname);
                    cb();
                });
        });
});

gulp.task('bump', ['test'], function () {
    var bumpType = plugins.util.env.type || 'patch'; // major.minor.patch

    return gulp.src(['./package.json'])
        .pipe(plugins.bump({type: bumpType}))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
    gulp.watch(paths.watch);
});

gulp.task('test', ['lint', 'istanbul']);

gulp.task('release', ['bump']);

gulp.task('default', ['test']);
