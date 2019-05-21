const webpack = require('webpack');
const path = require('path');

const BASE_PATH = path.join(__dirname, '..');

module.exports = {
  output: {
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader', 'webpack-conditional-loader'],
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      src: path.join(BASE_PATH, 'src'),
      dist: path.join(BASE_PATH, 'dist'),
      static: path.join(BASE_PATH, 'static'),
    },
  },
};