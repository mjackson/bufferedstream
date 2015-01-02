var webpack = require('webpack');

module.exports = {

  entry: './modules/BufferedStream.js',

  output: {
    library: 'BufferedStream',
    libraryTarget: 'var'
  },

  node: {
    buffer: false,
    process: false
  },

  plugins: [
    new webpack.DefinePlugin({
      'typeof window': JSON.stringify('object')
    })
  ]

};
