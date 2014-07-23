[![build status](https://secure.travis-ci.org/mjackson/bufferedstream.png)](http://travis-ci.org/mjackson/bufferedstream)

[BufferedStream](https://github.com/mjackson/bufferedstream) is a reliable read/write stream class for node.js and browsers. All data that is written to a BufferedStream is buffered until the next turn of the event loop. This greatly enhances the usability of streams by making it easy to setup listeners in the same turn of the event loop before data is emitted.

This class follows the first version of the node streams API, which is powerful because of its simplicity. Node has since moved on to other, much more complex streams implementations, but there never was a problem with the initial API. The only problems were with node's implementation. For example, streams did not always wait until the next tick to emit data. Also, some streams did not respect `pause`/`resume` semantics.

BufferedStream addresses these problems by providing a well-tested, performant implementation that preserves the original streams API and works in both node.js and browsers.

### Installation

Using [npm](http://npmjs.org):

    $ npm install bufferedstream

### Usage

The key feature of this class is that anything you write to the stream in the current turn of the event loop is buffered until the next one. This allows you to register event handlers, pause the stream, etc. reliably without losing any data.

```js
var BufferedStream = require('bufferedstream');

var stream = new BufferedStream;
stream.write('Hello ');
stream.pause();

setTimeout(function () {
  stream.write('IHdvcmxkLg==', 'base64');
  stream.resume();
  stream.on('data', function (chunk) {
    console.log(chunk.toString()); // Hello world.
  });
}, 10);
```

The `BufferedStream` constructor may also accept a "source" which may be another stream that will be piped directly through to this stream or a string. This is useful for wrapping various stream-like objects and normalizing their behavior across implementations.

Please see the source code for more information. The module is small enough (and well-documented) that it should be easy to digest in a quick skim.

### Specs

Run the specs with [mocha](http://visionmedia.github.com/mocha/):

    $ mocha spec

### License

[MIT](http://opensource.org/licenses/MIT)
