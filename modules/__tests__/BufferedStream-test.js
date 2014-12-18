/* jshint -W058 */
var assert = require('assert');
var expect = require('expect');
var binaryFrom = require('../utils/binaryFrom');
var binaryTo = require('../utils/binaryTo');
var collectDataInString = require('./helpers').collectDataInString;
var describeSourceType = require('./helpers').describeSourceType;
var BufferedStream = require('../BufferedStream');

describe('A BufferedStream', function () {

  describeSourceType('String', String);
  describeSourceType('BufferedStream', BufferedStream);

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

    it('is paused', function () {
      assert(stream.paused);
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
      stream.resume();
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
        var stream = new BufferedStream(binaryTo(binaryFrom(content), 'base64'), 'base64');

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

});
