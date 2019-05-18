const webpack = require('webpack');
const path = require('path');

const rootDir = '../src/';

module.exports = {
  entry: {
    background: path.join(__dirname, rootDir + 'background.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js'
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks: 'initial',
    }
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
  },
};