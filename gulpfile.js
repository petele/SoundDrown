/* eslint-env node */

'use strict';

const del = require('del');
const gulp = require('gulp');
const fs = require('fs-extra');
const semver = require('semver');
const csso = require('gulp-csso');
const copy = require('gulp-copy');
const jsdoc = require('gulp-jsdoc3');
const terser = require('gulp-terser');
const eslint = require('gulp-eslint');
const connect = require('gulp-connect');
const htmlmin = require('gulp-htmlmin');
const replace = require('gulp-replace');
const workbox = require('workbox-build');
const firebase = require('firebase-tools');
const runSequence = require('run-sequence');
const autoprefixer = require('gulp-autoprefixer');
const inlinesource = require('gulp-inline-source');

const SRC_DIR = 'src';
const DEST_DIR = 'build';
const TEMP_DIR = '.tmp';
const TERSER_OPTS = {
  compress: {
    drop_console: true,
  },
  output: {
    beautify: false,
    max_line_len: 120,
    indent_level: 2,
  },
};

/** ***************************************************************************
 * Bump Version Number
 *****************************************************************************/

/**
 * Bumps the version number in the package.json file.
 *
 * @param {string} release - Type of release patch|minor|major.
 * @return {Promise}.
 */
function bumpVersion(release) {
  return fs.readJson('package.json')
      .then((data) => {
        const currentVersion = data.version;
        const nextVersion = semver.inc(currentVersion, release);
        data.version = nextVersion;
        return fs.writeJson('package.json', data, {spaces: 2});
      });
}

gulp.task('bump:patch', () => {
  return bumpVersion('patch');
});


/** ***************************************************************************
 * Clean
 *****************************************************************************/

gulp.task('clean:temp', () => {
  const filesToDelete = ['.tmp/**'];
  return del(filesToDelete);
});

gulp.task('clean:build', () => {
  const filesToDelete = ['build/**'];
  return del(filesToDelete);
});

gulp.task('clean:docs', () => {
  const filesToDelete = ['docs/**'];
  return del(filesToDelete);
});

gulp.task('clean', (cb) => {
  return runSequence(['clean:build', 'clean:temp', 'clean:docs'], cb);
});


/** ***************************************************************************
 * Linting & Doc Generation
 *****************************************************************************/

gulp.task('lint', () => {
  const filesToLint = [
    'gulpfile.js',
    'src/index.html',
    'src/scripts/*',
    'src/inline-scripts/*',
  ];
  const config = {
    useEslintrc: true,
  };
  return gulp.src(filesToLint)
      .pipe(eslint(config))
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('jsdoc', ['clean:docs', 'lint'], () => {
  const filesToDoc = [
    'README.md',
    'src/scripts/*.js',
  ];
  const config = fs.readJsonSync('.jsdocrc.json');
  return gulp.src(filesToDoc, {read: false})
      .pipe(jsdoc(config));
});


/** ***************************************************************************
 * Generate Service Worker
 *****************************************************************************/

gulp.task('generate-service-worker', () => {
  return workbox.generateSW({
    globDirectory: DEST_DIR,
    globPatterns: [
      '**/*.{html,js,png,ico,mp3,json}',
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
      console.log(warning);
    }
  });
});


/** ***************************************************************************
 * Build
 *****************************************************************************/

gulp.task('css-build', () => {
  const autoprefixOpts = {
    browsers: ['last 2 versions'],
  };
  const cssoOpts = {
    sourceMap: true,
  };
  return gulp.src(`${SRC_DIR}/styles/styles.css`)
      .pipe(autoprefixer(autoprefixOpts))
      .pipe(csso(cssoOpts))
      .pipe(gulp.dest(`${TEMP_DIR}/styles/`));
});

gulp.task('js-inline', () => {
  return gulp.src(`${SRC_DIR}/inline-scripts/*.js`)
      .pipe(terser(TERSER_OPTS))
      .pipe(gulp.dest(`${TEMP_DIR}/inline-scripts`));
});

gulp.task('js-script', () => {
  return gulp.src(`${SRC_DIR}/scripts/*.js`)
      .pipe(terser(TERSER_OPTS))
      .pipe(gulp.dest(`${TEMP_DIR}/scripts`));
});

gulp.task('js-build', (cb) => {
  return runSequence(['js-inline', 'js-script'], cb);
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
    compress: false,
    pretty: false,
  };
  const htmlMinOpts = {
    collapseWhitespace: true,
    maxLineLength: 80,
    minifyCSS: true,
    minifyJS: false,
    removeComments: true,
  };
  const buildDate = new Date().toISOString();
  const packageJSON = fs.readJsonSync('package.json');
  return gulp.src(`${TEMP_DIR}/index.html`)
      .pipe(replace('[[BUILD_DATE]]', buildDate))
      .pipe(replace('[[VERSION]]', packageJSON.version))
      .pipe(inlinesource(inlineOpts))
      .pipe(htmlmin(htmlMinOpts))
      .pipe(gulp.dest(TEMP_DIR));
});

gulp.task('copy-static', () => {
  const filesToCopy = [
    `${TEMP_DIR}/index.html`,
    `${TEMP_DIR}/maps/**/*`,
    `${TEMP_DIR}/scripts/**/*`,
    `${SRC_DIR}/icons/**/*`,
    `${SRC_DIR}/images/**/*`,
    `${SRC_DIR}/sounds/**/*`,
    `${SRC_DIR}/manifest.json`,
    `${SRC_DIR}/robots.txt`,
    `${SRC_DIR}/humans.txt`,
  ];
  return gulp.src(filesToCopy)
      .pipe(copy(DEST_DIR, {prefix: 1}));
});

gulp.task('build:no-sw', ['clean'], (cb) => {
  return runSequence('html-build', 'copy-static', cb);
});

gulp.task('build', (cb) => {
  return runSequence('build:no-sw', 'generate-service-worker', cb);
});


/** ***************************************************************************
 * Development - serving
 *****************************************************************************/

gulp.task('serve', () => {
  return connect.server({root: 'src'});
});

gulp.task('serve:prod', ['build:no-sw'], () => {
  return connect.server({root: 'build'});
});


/** ***************************************************************************
 * Deploy
 *****************************************************************************/

gulp.task('deploy-firebase', () => {
  return firebase.deploy();
});

gulp.task('deploy', (cb) => {
  return runSequence('bump:patch', 'build', 'deploy-firebase', cb);
});
