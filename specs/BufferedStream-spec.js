var assert = require('assert');
var expect = require('expect');
var BufferedStream = require('../modules');
var isBinary = require('../modules/utils/isBinary');
var binaryFrom = require('../modules/utils/binaryFrom');
var binaryTo = require('../modules/utils/binaryTo');

describe('A BufferedStream', function () {
  describe('when newly created', function () {
    var stream = new BufferedStream;

    it('is empty', function () {
      assert(stream.empty);
    });

    it('is not full', function () {
      assert(!stream.full);
    });

    it('is not piped', function () {
      assert(!stream.piped);
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

  describe('when it is piped to', function () {
    var stream;
    beforeEach(function () {
      stream = new BufferedStream;

      var source = new BufferedStream;
      source.pause();

      source.pipe(stream);
    });

    it('is piped', function () {
      assert(stream.piped);
    });

    describe('twice', function () {
      it('throws', function () {
        expect(function () {
          (new BufferedStream).pipe(stream);
        }).toThrow(Error);
      });
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

    it('is paused', function () {
      assert(stream.paused);
    });

    describe('then resumed', function () {
      it('emits "end"', function (done) {
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
  });

  describe('that is ended but paused in a "data" event handler', function () {
    var stream;
    beforeEach(function () {
      stream = new BufferedStream(3);
      stream.end('hello');
      assert(stream.full);
    });

    it('is ended', function () {
      assert(stream.ended);
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
        stream.write(binaryTo(binaryFrom(content), 'base64'), 'base64');
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

  var describeNode = typeof process === 'undefined' ? describe.skip : describe;

  describeNode('when sourced from a node Readable', function () {
    it('does not throw', function () {
      var fs = require('fs');
      var source = fs.createReadStream(__filename);

      expect(function () {
        var stream = new BufferedStream(source);
      }).toNotThrow();
    });

    it('emits the entire contents of the source', function (done) {
      var fs = require('fs');
      var contents = fs.readFileSync(__filename);

      var stream = new BufferedStream(fs.createReadStream(__filename));

      collectDataInString(stream, function (string) {
        assert.equal(string, contents.toString());
        done();
      });
    });
  });
});

function collectData(stream, callback) {
  var chunks = [];

  stream.on('data', function (chunk) {
    chunks.push(chunk);
  });

  stream.on('end', function () {
    callback(chunks);
  });
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

function testSourceType(sourceTypeName, sourceType) {
  describe('when sourced from a ' + sourceTypeName, function () {
    var content = 'Hello world';
    var source;
    beforeEach(function () {
      source = sourceType(content);

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
