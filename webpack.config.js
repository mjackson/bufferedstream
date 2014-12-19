var webpack = require('webpack');

module.exports = {

  node: {
    buffer: false
  },

  output: {
    library: 'BufferedStream',
    libraryTarget: 'var'
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]

};
