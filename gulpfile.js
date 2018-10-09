/* */
'use strict';

const del = require('del');
const gulp = require('gulp');
const csso = require('gulp-csso');
const copy = require('gulp-copy');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const replace = require('gulp-replace');
const workbox = require('workbox-build');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
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

gulp.task('clean', (cb) => {
  return runSequence(['clean:temp', 'clean:build'], cb);
});

gulp.task('css-build', () => {
  const autoprefixOpts = {
    browsers: ['last 2 versions']
  };
  const cssoOpts = {
    sourceMap: true,
  };
  return gulp.src(`${SRC_DIR}/styles/styles.css`)
      .pipe(sourcemaps.init())
      .pipe(autoprefixer(autoprefixOpts))
      .pipe(csso(cssoOpts))
      .pipe(sourcemaps.write(`../maps/`))
      .pipe(gulp.dest(`${TEMP_DIR}/styles/`));
});

gulp.task('js-build', () => {
  return gulp.src(`${SRC_DIR}/scripts/app.js`)
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: ['@babel/env'],
      }))
      .pipe(uglify())
      .pipe(sourcemaps.write(`../maps/`))
      .pipe(gulp.dest(`${TEMP_DIR}/scripts`));
});

gulp.task('html-copy', () => {
  const filesToCopy = [
    `${SRC_DIR}/index.html`,
  ];
  return gulp.src(filesToCopy)
      .pipe(copy(TEMP_DIR, {prefix: 1}));
});

gulp.task('html-build', ['html-copy', 'css-build', 'js-build'], () => {
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
      .pipe(sourcemaps.init())
      .pipe(replace('[[BUILD_DATE]]', Date.now()))
      .pipe(htmlmin(htmlMinOpts))
      .pipe(inlinesource(inlineOpts))
      .pipe(sourcemaps.write(`maps/`))
      .pipe(gulp.dest(TEMP_DIR));
});

gulp.task('copy-static', () => {
  const filesToCopy = [
    `${TEMP_DIR}/index.html`,
    `${TEMP_DIR}/maps/**/*`,
    `${SRC_DIR}/images/**/*`,
    `${SRC_DIR}/manifest.json`,
    `${SRC_DIR}/robots.txt`,
    `${SRC_DIR}/humans.txt`,
  ];
  return gulp.src(filesToCopy)
      .pipe(copy(DEST_DIR, {prefix: 1}));
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
    offlineGoogleAnalytics: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'cacheFirst',
        options: {
          cacheName: 'googleapis',
          expiration: {maxEntries: 30},
        },
      },
    ],
  }).then(({warnings}) => {
    for (const warning of warnings) {
      console.warn(warning);
    }
  });
});

gulp.task('build:no-sw', ['clean'], (cb) => {
  return runSequence('html-build', 'copy-static', cb);
});

gulp.task('build', (cb) => {
  return runSequence('build:no-sw', 'generate-service-worker', cb);
});
