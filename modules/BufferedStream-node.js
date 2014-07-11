var Stream = require('stream');
var BufferedStream = require('./BufferedStream');
var d = require('d');
var ee = require('event-emitter');
var allOff = require('event-emitter/all-off');

Object.defineProperties(BufferedStream.prototype, {

  pipe: d(Stream.prototype.pipe),

  addListener: d(ee.methods.on),

  // Node's Stream.prototype.pipe uses this method.
  removeListener: d(ee.methods.off),

  removeAllListeners: d(function () {
    allOff(this);
    return this;
  })

});

module.exports = BufferedStream;
