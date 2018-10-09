/* */
'use strict';

const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const copy = require('gulp-copy');
const htmlmin = require('gulp-htmlmin');
const replace = require('gulp-replace');
const workbox = require('workbox-build');
const runSequence = require('run-sequence');

const BUILD_DIR = 'build';

gulp.task('clean', () => {
  const filesToDelete = ['build/**'];
  return del(filesToDelete);
});

gulp.task('copy', () => {
  const filesToCopy = [
    'src/images/**/*',
    'src/manifest.json',
    'src/robots.txt',
  ];
  return gulp.src(filesToCopy)
      .pipe(copy(BUILD_DIR, {prefix: 1}));
});

gulp.task('minify-html', () => {
  const opts = {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
  };
  return gulp.src('src/*.html')
      .pipe(replace('[[BUILD_DATE]]', Date.now()))
      .pipe(htmlmin(opts))
      .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('build-js', () => {
  return gulp.src('src/scripts/**/*.js')
      .pipe(babel({
        presets: ['@babel/env'],
      }))
      .pipe(uglify())
      .pipe(gulp.dest(`${BUILD_DIR}/scripts`));
});

gulp.task('generate-service-worker', () => {
  return workbox.generateSW({
    globDirectory: BUILD_DIR,
    globPatterns: [
      '**/*.{html,js,png,ico}',
    ],
    swDest: `${BUILD_DIR}/service-worker.js`,
    clientsClaim: true,
    skipWaiting: true,
  }).then(({warnings}) => {
    for (const warning of warnings) {
      console.warn(warning);
    }
  }).catch((error) => {
    console.error('Service worker generation failed:', error);
  });
});

gulp.task('build', (cb) => {
  return runSequence('clean',
      ['copy', 'minify-html', 'build-js'],
      ['generate-service-worker'],
      cb);
});
