var fs = require('fs');
var assert = require('assert');
var expect = require('expect');
var collectDataInString = require('./helpers').collectDataInString;
var describeSourceType = require('./helpers').describeSourceType;
var BufferedStream = require('../index');

describe('A BufferedStream that is sourced from a node Readable', function () {

  describeSourceType('Buffer', Buffer);

  it('does not throw', function () {
    var source = fs.createReadStream(__filename);

    expect(function () {
      new BufferedStream(source);
    }).toNotThrow();
  });

  it('emits the entire contents of the source', function (done) {
    var source = fs.readFileSync(__filename, 'utf8');
    var stream = new BufferedStream(fs.createReadStream(__filename));

    collectDataInString(stream, function (string) {
      assert.equal(string, source);
      done();
    });
  });

  describe('when it contains a multibyte string', function () {
    it('emits the string correctly', function (done) {
      var source = fs.readFileSync(__dirname + '/card.json', 'utf8');
      var stream = new BufferedStream(source);

      collectDataInString(stream, function (string) {
        assert.equal(string, source);
        done();
      });
    });
  });

});
