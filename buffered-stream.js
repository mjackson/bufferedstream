var util = require('util');
var Stream = require('stream');

// Use node 0.10's setImmediate for asynchronous operations, otherwise for
// older versions of node use process.nextTick.
var async = (typeof setImmediate === 'function') ? setImmediate : process.nextTick;

module.exports = BufferedStream;

/**
 * A readable/writable Stream subclass that buffers data until next tick. The
 * maxSize determines the number of bytes the buffer can hold before it is
 * considered "full". This argument may be omitted to indicate this stream has
 * no maximum size.
 *
 * The source and sourceEncoding arguments may be used to easily wrap this
 * stream around another, or a simple string. If the source is another stream,
 * it is piped to this stream. If it's a string, it is used as the entire
 * contents of this stream and passed to end.
 *
 * NOTE: The maxSize is a soft limit that is only used to determine when calls
 * to write will return false, indicating to streams that are writing to this
 * stream that they should pause. In any case, calls to write will still append
 * to the buffer so that no data is lost.
 */
function BufferedStream(maxSize, source, sourceEncoding) {
  if (!(this instanceof BufferedStream)) {
    return new BufferedStream(maxSize, source, sourceEncoding);
  }

  Stream.call(this);

  if (typeof maxSize !== 'number') {
    sourceEncoding = source;
    source = maxSize;
    maxSize = Infinity;
  }

  // Public interface.
  this.maxSize = maxSize;
  this.size = 0;
  this.encoding = null;
  this.paused = false;
  this.ended = false;
  this.readable = true;
  this.writable = true;

  this._buffer = [];
  this._flushing = false;
  this._wasFull = false;

  if (typeof source !== 'undefined') {
    if (source instanceof Stream) {
      source.pipe(this);
    } else {
      this.end(source, sourceEncoding);
    }
  }
}

util.inherits(BufferedStream, Stream);

/**
 * A read-only property that returns true if this stream has no data to emit.
 */
BufferedStream.prototype.__defineGetter__('empty', function () {
  return this._buffer == null || this._buffer.length === 0;
});

/**
 * A read-only property that returns true if this stream's buffer is full.
 */
BufferedStream.prototype.__defineGetter__('full', function () {
  return this.maxSize < this.size;
});

/**
 * Sets this stream's encoding. If an encoding is set, this stream will emit
 * strings using that encoding. Otherwise, it emits Buffer objects.
 */
BufferedStream.prototype.setEncoding = function (encoding) {
  this.encoding = encoding;
};

/**
 * Prevents this stream from emitting data events until resume is called.
 * Note: This does not prevent writes to this stream.
 */
BufferedStream.prototype.pause = function () {
  this.paused = true;
};

/**
 * Resumes emitting data events.
 */
BufferedStream.prototype.resume = function () {
  if (this.paused) flushOnNextTick(this);
  this.paused = false;
};

/**
 * Writes the given chunk of data to this stream. Returns false if this
 * stream is full and should not be written to further until drained, true
 * otherwise.
 */
BufferedStream.prototype.write = function (chunk, encoding) {
  if (!this.writable) throw new Error('Stream is not writable');
  if (this.ended) throw new Error('Stream is already ended');

  if (typeof chunk === 'string') chunk = new Buffer(chunk, encoding);

  this._buffer.push(chunk);
  this.size += chunk.length;

  flushOnNextTick(this);

  if (this.full) {
    this._wasFull = true;
    return false;
  }

  return true;
};

/**
 * Writes the given chunk to this stream and queues the end event to be
 * called as soon as soon as possible. If the stream is not currently
 * scheduled to be flushed, the end event will fire immediately. Otherwise, it
 * will fire after the next flush.
 */
BufferedStream.prototype.end = function (chunk, encoding) {
  if (this.ended) throw new Error('Stream is already ended');

  if (chunk != null) this.write(chunk, encoding);
  this.ended = true;

  // Trigger the flush cycle one last time to emit any data that
  // was written before end was called.
  flushOnNextTick(this);
};

function flushOnNextTick(stream) {
  if (stream._flushing) return;
  stream._flushing = true;

  async(function tick() {
    if (stream.paused) {
      stream._flushing = false;
      return;
    }

    flush(stream);

    if (stream.empty) {
      stream._flushing = false;
    } else {
      async(tick);
    }
  });
}

function flush(stream) {
  if (!stream._buffer) return;

  var chunk;
  while (stream._buffer.length) {
    chunk = stream._buffer.shift();
    stream.size -= chunk.length;

    if (stream.encoding) {
      stream.emit('data', chunk.toString(stream.encoding));
    } else {
      stream.emit('data', chunk);
    }

    // If the stream was paused in a data event handler, break.
    if (stream.paused) break;
  }

  if (stream.ended && !stream.paused) {
    stream._buffer = null;
    stream.emit('end');
  } else if (stream._wasFull && !stream.full) {
    stream._wasFull = false;
    stream.emit('drain');
  }
}
