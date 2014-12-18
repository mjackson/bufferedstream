var assert = require('assert');
var binaryTo = require('../utils/binaryTo');
var isBinary = require('../utils/isBinary');
var BufferedStream = require('../BufferedStream');

function collectData(stream, callback) {
  var chunks = [];

  stream.on('data', function (chunk) {
    chunks.push(chunk);
  });

  stream.on('end', function () {
    callback(chunks);
  });

  stream.resume();
}

function stringifyData(data) {
  return binaryTo(require('bodec').join(data));
}

function collectDataInString(stream, callback) {
  collectData(stream, function (data) {
    callback(stringifyData(data));
  });
}

function collectDataFromSource(source, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = null;
  }

  var stream = new BufferedStream(source);
  stream.encoding = encoding;
  collectData(stream, callback);

  return stream;
}

function temporarilyPauseThenCollectDataFromSource(source, encoding, callback) {
  var stream = collectDataFromSource(source, encoding, callback);
  stream.pause();
  setTimeout(function () {
    stream.resume();
  });
}

function describeSourceType(sourceType, sourceFactory) {
  describe('when sourced from a ' + sourceType, function () {
    var content = 'Hello world';
    var source;
    beforeEach(function () {
      source = sourceFactory(content);

      if (typeof source.pause === 'function')
        source.pause();
    });

    it('emits its content as binary data', function (callback) {
      collectDataFromSource(source, function (data) {
        data.forEach(function (chunk) {
          assert(isBinary(chunk));
        });
        assert.equal(stringifyData(data), content);
        callback(null);
      });
    });

    describe('and an encoding is set', function () {
      it('emits its content as strings', function (callback) {
        collectDataFromSource(source, 'utf8', function (data) {
          data.forEach(function (chunk) {
            assert.equal(typeof chunk, 'string');
          });
          assert.equal(data.join(''), content);
          callback(null);
        });
      });
    });

    describe('and temporarily paused', function () {
      it('emits its content as binary data', function (callback) {
        temporarilyPauseThenCollectDataFromSource(source, function (data) {
          data.forEach(function (chunk) {
            assert(isBinary(chunk));
          });
          assert.equal(stringifyData(data), content);
          callback(null);
        });
      });

      describe('and an encoding is set', function () {
        it('emits its content as strings', function (callback) {
          temporarilyPauseThenCollectDataFromSource(source, 'utf8', function (data) {
            data.forEach(function (chunk) {
              assert.equal(typeof chunk, 'string');
            });
            assert.equal(data.join(''), content);
            callback(null);
          });
        });
      });
    });
  });
}

module.exports = {
  collectDataInString: collectDataInString,
  describeSourceType: describeSourceType
};
