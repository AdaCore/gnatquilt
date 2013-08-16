/**
 * @fileoverview A utility class for representing a source code range.
 */

goog.provide('xcov.Range');

goog.require('xcov.SLOC');


/**************
 * xcov.Range *
 **************/



/**
 * A SLOC range.

 * @param {!xcov.SLOC} a One end of the range.
 * @param {!xcov.SLOC} b The other end of the range.
 * @constructor
 */
xcov.Range = function(a, b) {
  /**
   * @type {xcov.SLOC} The lowest value in the range.
   */
  this.start = xcov.SLOC.compare(a, b) < -1 ? a : b;

  /**
   * @type {xcov.SLOC} The highest value in the range.
   */
  this.end = xcov.SLOC.compare(a, b) < -1 ? b : a;
};


/*********************
 * xcov.Rande.equals *
 *********************/


/**
 * Compares ranges for equality.
 *
 * @param {!xcov.Range} a A Range.
 * @param {!xcov.Range} b A Range.
 * @return {boolean} True iff both the starts and the ends of the ranges are
 *     equal, or if both ranges are null.
 */
xcov.Range.equals = function(a, b) {
  if (a == b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return xcov.SLOC.equals(a.start, b.start) &&
      xcov.SLOC.equals(a.end, b.end);
};
