/**
 * @fileoverview A utility class for representing a source location.
 */

goog.provide('xcov.SLOC');


/*************
 * xcov.SLOC *
 *************/



/**
 * Class for representing source location.
 *
 * @param {number=} opt_line Line, defaults to 0.
 * @param {number=} opt_column Column, defaults to 0.
 * @constructor
 */
xcov.SLOC = function(opt_line, opt_column) {
  /**
   * @type {number} Line value.
   */
  this.line = goog.isDef(opt_line) ? opt_line : 0;

  /**
   * @type {number} Column value.
   */
  this.column = goog.isDef(opt_column) ? opt_column : 0;
};


/********************
 * xcov.SLOC.equals *
 ********************/


/**
 * Compares SLOC for equality.

 * @param {xcov.SLOC} a A SLOC.
 * @param {xcov.SLOC} b A SLOC.
 * @return {boolean} True if the SLOC are equal, or if both are {@code null}.
 */
xcov.SLOC.equals = function(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a.line === b.line && a.column === b.column;
};


/*********************
 * xcov.SLOC.compare *
 *********************/


/**
 * Compares SLOC.

 * @param {!xcov.SLOC} a A SLOC.
 * @param {!xcov.SLOC} b A SLOC.
 * @return {number} {@code 0} if the SLOC are equal, or if both are
 *    {@code null}, {@code -1} if {@code a} is less than {@code b}, {@code +1}
 *    if {@code a} is greater than {@code b}.
 */
xcov.SLOC.compare = function(a, b) {
  if (a === b) {
    return 0;
  }

  if (a.line === b.line) {
    if (a.column === b.column) {
      return 0;
    }

    return a.column < b.column ? -1 : 1;
  }

  return a.line < b.line ? -1 : 1;
};
