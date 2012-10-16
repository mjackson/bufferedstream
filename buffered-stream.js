var util = require('util');
var Stream = require('stream');

module.exports = BufferedStream;

/**
 * A readable/writable Stream that buffers data until next tick. The maxSize
 * determines the byte size at which the buffer is considered "full". This is a
 * soft limit that is only used to determine when calls to write will return
 * false, which indicates to a writing stream that it should pause. This
 * argument may be omitted to indicate this stream has no maximum size.
 *
 * The source and sourceEncoding arguments may be used to easily wrap this
 * stream around another, or a simple string. If the source is another stream,
 * it is piped to this stream. If it's a string, it is used as the entire
 * contents of this stream and passed to end.
 */
function BufferedStream(maxSize, source, sourceEncoding) {
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
  this.readable = true;
  this.writable = true;
  this.paused = false;
  this.ended = false;

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
  return this._buffer && this._buffer.length === 0;
});

/**
 * A read-only property that returns true if this stream's buffer is full.
 */
BufferedStream.prototype.__defineGetter__('full', function () {
  return this.maxSize < this.size;
});

/**
 * Sets this stream's encoding. If an encoding is set, this stream will emit
 * strings using that encoding. Otherwise, it emits buffers.
 */
BufferedStream.prototype.setEncoding = function (encoding) {
  this.encoding = encoding;
};

/**
 * Prevents this stream from emitting data events until resume is called.
 * This does not prevent writes to this stream.
 */
BufferedStream.prototype.pause = function () {
  this.paused = true;
  this.emit('pause');
};

/**
 * Resumes emitting data events.
 */
BufferedStream.prototype.resume = function () {
  this.paused = false;
  this.emit('resume');

  if (!this.empty) {
    flushOnNextTick(this);
  }

  if (this.ended) {
    endOnNextTick(this);
  }
};

/**
 * Writes the given chunk of data to this stream. Returns false if this
 * stream is full and should not be written to further until drained, true
 * otherwise.
 */
BufferedStream.prototype.write = function (chunk, encoding) {
  if (!this.writable || this.ended) {
    throw new Error('Stream is not writable');
  }

  if (typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }

  this._buffer.push(chunk);
  this.size += chunk.length;

  if (!this._flushing) {
    flushOnNextTick(this);
    this._flushing = true;
  }

  if (this.full) {
    this._wasFull = true;
    return false;
  }

  return true;
};

/**
 * Tries to emit all data that is currently in the buffer out to all data
 * listeners. If this stream is paused, not readable, has no data in the buffer
 * this method does nothing. If this stream has previously returned false from
 * a write and any space is available in the buffer after flushing, a drain
 * event is emitted.
 */
BufferedStream.prototype.flush = function () {
  var chunk;
  while (!this.paused && this.readable && this._buffer.length) {
    chunk = this._buffer.shift();
    this.size -= chunk.length;

    if (this.encoding) {
      this.emit('data', chunk.toString(this.encoding));
    } else {
      this.emit('data', chunk);
    }
  }

  // Emit "drain" if the stream was full at one point but now
  // has some room in the buffer.
  if (this._wasFull && !this.full) {
    this._wasFull = false;
    this.emit('drain');
  }
};

/**
 * Writes the given chunk to this stream and queues the end event to be
 * called as soon as all data events have been emitted.
 */
BufferedStream.prototype.end = function (chunk, encoding) {
  if (this.ended) {
    throw new Error('Stream is already ended');
  }

  if (arguments.length > 0) {
    this.write(chunk, encoding);
  }

  this.ended = true;

  endOnNextTick(this);
};

/**
 * Destroys this stream immediately. It is no longer readable or writable. This
 * method should rarely ever be called directly by users as it will be called
 * automatically when using BufferedStream#end.
 */
BufferedStream.prototype.destroy = function () {
  this._buffer = null;
  this.readable = false;
  this.writable = false;
};

function flushOnNextTick(stream) {
  process.nextTick(function flush() {
    stream.flush();

    if (stream.empty) {
      stream._flushing = false;
    } else if (stream.paused) {
      return;
    } else {
      process.nextTick(flush);
    }
  });
}

function endOnNextTick(stream) {
  process.nextTick(function end() {
    if (stream.empty) {
      stream.destroy();
      stream.emit('end');
    } else if (stream.paused) {
      return;
    } else {
      process.nextTick(end);
    }
  });
}
