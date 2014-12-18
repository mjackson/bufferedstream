module.exports = function (config) {
  config.set({

    browsers: [ 'Chrome' ],

    frameworks: [ 'mocha' ],

    files: [
      'modules/tests.webpack.js'
    ],

    preprocessors: {
      'modules/tests.webpack.js': [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      devtool: 'inline-source-map'
    },

    webpackServer: {
      noInfo: true
    }

  });
};
