const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

const BASE_PATH = path.join(__dirname, '..');
const TEST_DIR = path.join(BASE_PATH, 'test');
const SCRIPT_DIR = path.join(BASE_PATH, 'src/scripts');
const OUT_PATH = path.join(BASE_PATH, 'dist');

const scriptBuild = merge(common, {
  entry: {
    'minify-config': path.join(SCRIPT_DIR, 'minify-config.ts'),
    'update-config': path.join(SCRIPT_DIR, 'update-config.ts'),
  },
  output: {
    path: OUT_PATH,
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  target: 'node',
});

const scriptTest = merge(common, {
  entry: {
    test: path.join(TEST_DIR, 'tests.ts'),
  },
  output: {
    path: OUT_PATH,
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  target: 'node',
});

module.exports = [scriptBuild, scriptTest];
