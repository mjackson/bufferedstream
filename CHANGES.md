= 3.1.0 / 2015-01-18

  * Removed "modules" directory

= 3.0.9 / 2015-01-14

  * Use utf-8 encoding by default, instead of binary

= 3.0.8 / 2015-01-13

  * Update bodec to 1.0.0

= 3.0.5 / 2014-12-22

  * Update bodec dependency for browsers
  * Removed dependency on d

= 3.0.3 / 2014-12-18

  * Better browser tests using karma

= 3.0.2 / 2014-11-10

  * Remove tests from npm package

= 3.0.1 / 2014-11-07

  * Use process.nextTick/window.setTimeout for async scheduling
  * Remove dependency on when.js

= 3.0.0 / 2014-09-10

  * Streams start paused by default
  * (new BufferedStream) instanceof Stream is true on node.js
  * Use when/lib/async instead of asap

= 2.8.0 / 2014-08-28

  * Use asap instead of setImmediate

= 2.7.0 / 2014-08-26

  * Use bodec instead of Buffer for smaller browser builds

= 2.6.0 / 2014-08-15

  * Add BufferedStream#piped
  * Prevent piping two different streams to the same BufferedStream
    simultaneously to prevent data corruption
  * Correctly setup BufferedStream#constructor

= 2.5.0 / 2014-08-07

  * Use Browserify's events module instead of event-emitter

= 2.4.0 / 2014-08-05

  * Use Browserify's Buffer module instead of bops
  * Added browser specs

= 2.3.1 / 2014-08-04

  * Fix compat regression with node v2 Readable streams

= 2.3.0 / 2014-08-02

  * Auto-resume on pipe(). This mimics the behavior of node streams v2

= 2.2.0 / 2014-07-14

  * Don't emit "drain" when stream is already ended
  * Maximum stream length defaults to 64k

= 2.1.0 / 2014-07-10

  * Introduced browser compatibility
  * Removed dependency on node

= 1.6.0 / 2013-03-18

  * Use node 0.10's setImmediate instead of process.nextTick (thanks @jeffbski).

= 1.5.1 / 2013-03-09

  * Don't emit "end" when paused (thanks @utricularian).

= 1.5.0 / 2013-02-19

  * Don't emit non-standard "pause" and "resume" events.
  * Ignore flushes after ending.

= 1.4.1 / 2012-11-29

  * Emit "end" even if the stream is empty after being resumed in a future tick.

= 1.4.0 / 2012-11-29

  * The "end" event isn't emitted until the next tick, even on empty streams.

= 1.3.0 / 2012-10-17

  * Removed BufferedStream#flush to be more consistent with native node streams.
  * More tests.

= 1.2.0 / 2012-10-16

  * Fixed a bug that caused end to be emitted multiple times when using pause
    & resume functionality.
  * Calling pause/resume consecutively only emits an event if the stream is
    currently in the opposite state.
  * Make paused part of the public interface.
  * Make the buffer of a destroyed stream null to save on memory.
  * Removed BufferedStream#destroy.

= 1.1.0 / 2012-10-08

  * Don't prevent the process from exiting when data is still left in the
    stream. This is a responsibility of the stream consumer, not the stream
    itself (thanks @jeffbski).

= 1.0.2 / 2012-10-07

  * Use setInterval instead of process.nextTick to prevent pegging the CPU
    when streams are paused (thanks @jeffbski).
  * Use Infinity instead of -1 to indicate that a stream has no maximum size
    (thanks @mscdex).
  * Use mocha for testing.
