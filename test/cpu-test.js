var BufferedStream = require('../buffered-stream');

var stream;
for (var i = 0; i < 1000; ++i) {
  stream = new BufferedStream('Hello world');
  stream.pause();
  console.log(i + ' stream paused');
}
