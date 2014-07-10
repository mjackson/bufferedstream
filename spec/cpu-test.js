var BufferedStream = require('../buffered-stream');

var stream = new BufferedStream();

stream.on('data', function (chunk) {
  console.log(chunk.toString());
});

stream.on('end', function () {
  console.log('end');
});

stream.write('Hello');
stream.pause();

// setTimeout(function () {
//   stream.resume();
//
//   stream.write('Goodbye');
//   stream.pause();
//
//   setTimeout(function () {
//     stream.resume();
//   }, 500);
// }, 500);
