var assert = require('assert');
var expect = require('expect');
var bops = require('bops');
var BufferedStream = require('../BufferedStream');

describe('A BufferedStream', function () {
  describe('when newly created', function () {
    var stream = new BufferedStream;

    it('is empty', function () {
      assert(stream.empty);
    });

    it('is not full', function () {
      assert(!stream.full);
    });

    it('is readable', function () {
      assert(stream.readable);
    });

    it('is writable', function () {
      assert(stream.writable);
    });

    it('is not paused', function () {
      assert(!stream.paused);
    });

    it('is not ended', function () {
      assert(!stream.ended);
    });

    it('does not have an encoding', function () {
      assert(!stream.encoding);
    });
  });

  describe('with a maxSize of 0', function () {
    it('is not full', function () {
      var stream = new BufferedStream(0);
      assert(!stream.full);
    });
  });

  describe('setEncoding', function () {
    it('sets the encoding of the stream', function () {
      var stream = new BufferedStream;
      stream.setEncoding('utf8');
      expect(stream.encoding).toEqual('utf8');
    });
  });

  describe('that is paused', function () {
    var stream;
    beforeEach(function () {
      stream = new BufferedStream;
      stream.pause();
    });

    it('only emits "end" after it is resumed', function (done) {
      var endWasCalled = false;
      stream.on('end', function () {
        endWasCalled = true;
      });

      stream.end();
      expect(endWasCalled).toEqual(false);

      setTimeout(function () {
        stream.resume();
        setTimeout(function () {
          expect(endWasCalled).toEqual(true);
          done();
        }, 5);
      }, 0);
    });
  });

  describe('that is ended but paused in a "data" event handler', function () {
    var stream;
    beforeEach(function () {
      stream = new BufferedStream(3);
    });

    it('does not emit "drain" events', function (done) {
      var endWasCalled = false;
      stream.on('end', function () {
        endWasCalled = true;
      });

      var drainWasCalled = false;
      stream.on('drain', function () {
        drainWasCalled = true;
      });

      stream.end('hello');
      assert(stream.full);

      stream.on('data', function () {
        stream.pause();
        setTimeout(function () {
          stream.resume();
          setTimeout(function () {
            expect(endWasCalled).toEqual(true);
            expect(drainWasCalled).toEqual(false);
            done();
          }, 5);
        }, 5);
      });
    });
  });

  describe('when paused and resumed multiple times', function () {
    var count;
    beforeEach(function (callback) {
      count = 0;

      var stream = new BufferedStream('Hello world');
      stream.pause();
      stream.resume();
      stream.pause();
      stream.resume();

      stream.on('end', function () {
        count += 1;
        callback(null);
      });
    });

    it('emits end only once', function () {
      expect(count).toEqual(1);
    });
  });

  describe('write', function () {
    it('throws when a stream is not writable', function () {
      var stream = new BufferedStream;
      stream.writable = false;
      expect(function () {
        stream.write('test');
      }).toThrow(/not writable/);
    });

    it('throws when a stream is already ended', function () {
      var stream = new BufferedStream;
      stream.end();
      expect(function () {
        stream.write('test');
      }).toThrow(/already ended/);
    });

    describe('when called with a string in base64 encoding', function () {
      it('uses the proper encoding', function (callback) {
        var content = 'hello';
        var stream = new BufferedStream;
        stream.write(bops.to(bops.from(content), 'base64'), 'base64');
        stream.end();

        collectDataInString(stream, function (string) {
          expect(string).toEqual(content);
          callback(null);
        });
      });
    });
  });

  describe('end', function () {
    var stream;
    beforeEach(function () {
      stream = new BufferedStream;
      stream.end();
    });

    it('makes a stream ended', function () {
      assert(stream.ended);
    });

    it('throws an error when end is called', function () {
      expect(function () {
        stream.end();
      }).toThrow(/already ended/);
    });
  });

  testSourceType('String', String);
  testSourceType('BufferedStream', BufferedStream);

  if (typeof Buffer !== 'undefined')
    testSourceType('Buffer', Buffer);
});

function collectData(stream, callback) {
  var data = [];

  stream.on('data', function (chunk) {
    data.push(chunk);
  });

  stream.on('end', function () {
    callback(data);
  });
}

function stringifyData(data) {
  return data.map(function (chunk) {
    return chunk.toString();
  }).join('');
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

  if (source && typeof source.resume === 'function')
    source.resume();

  return stream;
}

function temporarilyPauseThenCollectDataFromSource(source, encoding, callback) {
  var stream = collectDataFromSource(source, encoding, callback);
  stream.pause();
  setTimeout(function () {
    stream.resume();
  }, 1);
}

function testSourceType(sourceTypeName, sourceType) {
  describe('when sourced from a ' + sourceTypeName, function () {
    var content = 'Hello world';
    var source;
    beforeEach(function () {
      source = sourceType(content);
      if (typeof source.pause === 'function') {
        source.pause();
      }
    });

    it('emits its content as Buffers', function (callback) {
      collectDataFromSource(source, function (data) {
        data.forEach(function (chunk) {
          assert(chunk instanceof Buffer);
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
          assert.equal(stringifyData(data), content);
          callback(null);
        });
      });
    });

    describe('and temporarily paused', function () {
      it('emits its content as Buffers', function (callback) {
        temporarilyPauseThenCollectDataFromSource(source, function (data) {
          data.forEach(function (chunk) {
            assert(chunk instanceof Buffer);
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
            assert.equal(stringifyData(data), content);
            callback(null);
          });
        });
      });
    });
  });
}
