var bops = require('bops');
var BufferedStream = require('../modules');

var stream = new BufferedStream();

stream.on('data', function (chunk) {
  console.log(bops.to(chunk));
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
