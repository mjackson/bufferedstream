var webpack = require('webpack');

module.exports = {

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
