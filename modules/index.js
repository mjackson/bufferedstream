var BufferedStream;
if (typeof process !== 'undefined' && process.versions.node) {
  var moduleID = './BufferedStream-node';
  BufferedStream = require(moduleID); // Foil Browserify.
} else {
  BufferedStream = require('./BufferedStream');
}

module.exports = BufferedStream;
