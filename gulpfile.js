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
const inlinesource = require('gulp-inline-source');

const SRC_DIR = 'src';
const DEST_DIR = 'build';
const TEMP_DIR = '.tmp';

gulp.task('clean:temp', () => {
  const filesToDelete = ['.tmp/**'];
  return del(filesToDelete);
});

gulp.task('clean:build', () => {
  const filesToDelete = ['build/**'];
  return del(filesToDelete);
});

gulp.task('clean', ['clean:temp', 'clean:build'], () => {});

gulp.task('copy-static-files', () => {
  const filesToCopy = [
    `${SRC_DIR}/images/**/*`,
    `${SRC_DIR}/manifest.json`,
    `${SRC_DIR}/robots.txt`,
  ];
  return gulp.src(filesToCopy)
      .pipe(copy(DEST_DIR, {prefix: 1}));
});

gulp.task('js-build-temp', () => {
  return gulp.src(`${SRC_DIR}/scripts/**/*.js`)
      .pipe(babel({
        presets: ['@babel/env'],
      }))
      .pipe(uglify())
      .pipe(gulp.dest(`${TEMP_DIR}/scripts`));
});

gulp.task('html-build-temp', () => {
  return gulp.src(`${SRC_DIR}/index.html`)
      .pipe(replace('[[BUILD_DATE]]', Date.now()))
      .pipe(gulp.dest(TEMP_DIR));
});

gulp.task('html-inline-and-minify', () => {
  const inlineOpts = {
    compress: true,
    pretty: false,
  };
  const htmlMinOpts = {
    collapseWhitespace: true,
    maxLineLength: 80,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
  };
  return gulp.src(`${TEMP_DIR}/index.html`)
      .pipe(htmlmin(htmlMinOpts))
      .pipe(inlinesource(inlineOpts))
      .pipe(gulp.dest(TEMP_DIR));
});

gulp.task('html-copy-finished', () => {
  return gulp.src(`${TEMP_DIR}/index.html`)
      .pipe(gulp.dest(DEST_DIR));
});

gulp.task('generate-service-worker', () => {
  return workbox.generateSW({
    globDirectory: DEST_DIR,
    globPatterns: [
      '**/*.{html,js,png,ico}',
    ],
    swDest: `${DEST_DIR}/service-worker.js`,
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
      ['copy-static-files', 'js-build-temp', 'html-build-temp'],
      'html-inline-and-minify',
      'html-copy-finished',
      ['generate-service-worker', 'clean:temp'],
      cb);
});
