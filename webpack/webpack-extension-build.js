const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');
const CopyPlugin = require('copy-webpack-plugin');

const BASE_PATH = path.join(__dirname, '..');
const SOURCE_DIR = path.join(BASE_PATH, 'src/chrome');
const OUT_PATH = path.join(BASE_PATH, 'app');

module.exports = merge(common, {
  entry: {
    background: path.join(SOURCE_DIR, 'background.ts'),
  },
  output: {
    path: OUT_PATH,
  },
  plugins: [
    new CopyPlugin([
      {from: 'static/chrome'},
    ]),
  ],
});
