/**
 * @fileoverview Interface for structures capable of counting the lines
 *    containing coverage-related information.
 */


goog.provide('xcov.Enumerable');

goog.require('goog.Disposable');

goog.require('xcov.coverage');


/*******************
 * xcov.Enumerable *
 *******************/



/**
 * Abstract class exposing 2 methods:
 *    - getLineCount
 *    - getLinePercentage
 *
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.Enumerable = function() {
  goog.base(this);
};
goog.inherits(xcov.Enumerable, goog.Disposable);


/********************************
 * xcov.Enumerable.getLineCount *
 ********************************/


/**
 * Returns the total lines of interest in all files, optionally filtered by
 * coverage status.
 *
 * @param {xcov.coverage.Status=} opt_status Optional coverage status for
 *    filtering.
 * @return {number} The total number of lines in all files, given the input
 *    rules.
 */
xcov.Enumerable.prototype.getLineCount = goog.abstractMethod;


/*************************************
 * xcov.Enumerable.getLinePercentage *
 *************************************/


/**
 * Returns the percentage of line with the given status among the total number
 * of relevant lines.
 *
 * @param {xcov.coverage.Status} status Coverage status for filtering.
 * @return {number} The total number of lines in all files, given the input
 *    rules.
 */
xcov.Enumerable.prototype.getLinePercentage = function(status) {
  /** @const */ var relevantLineCount = this.getLineCount();

  if (relevantLineCount === 0) {
    return 0;
  }

  return Math.round(this.getLineCount(status) * 100 / relevantLineCount);
};


/*************************************
 * xcov.Enumerable.comparePercentage *
 *************************************/


/**
 * Compares this enumerable against the provided one.
 *
 * @param {!xcov.Enumerable} other The other enumerable to compare the first
 *    one against.
 * @param {xcov.coverage.Status=} opt_status Optional status to use for
 *    comparison. Compares against all statuses if not specified.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.Enumerable.prototype.comparePercentage = function(other, opt_status) {
  /** @const */ var ORDERED_STATUS = goog.isDefAndNotNull(opt_status) ?
      [opt_status] : [
        xcov.coverage.Status.COVERED,
        xcov.coverage.Status.PARTIALLY_COVERED,
        xcov.coverage.Status.NOT_COVERED,
        xcov.coverage.Status.EXEMPTED_NO_VIOLATION,
        xcov.coverage.Status.EXEMPTED_WITH_VIOLATION
      ];

  /** @type {number} */ var result = 0;

  goog.array.forEach(ORDERED_STATUS, function(status) {
    if (result !== 0) {
      return;
    }

    /** @const */ var aPercentage = this.getLinePercentage(status);
    /** @const */ var bPercentage = other.getLinePercentage(status);

    /** @const */ var aCount = this.getLineCount(status);
    /** @const */ var bCount = other.getLineCount(status);

    if (aPercentage !== bPercentage) {
      result = aPercentage < bPercentage ? -1 : 1;
    } else if (aCount !== bCount) {
      result = aCount < bCount ? -1 : 1;
    }
  }, this /* opt_obj */);

  return result;
};


/********************************
 * xcov.Enumerable.compareCount *
 ********************************/


/**
 * Compares this enumerable against the provided one.
 *
 * @param {!xcov.Enumerable} other The other enumerable to compare the first
 *    one against.
 * @param {xcov.coverage.Status=} opt_status Optional status to use for
 *    comparison. Compares against all statuses if not specified.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.Enumerable.prototype.compareCount = function(other, opt_status) {
  /** @const */ var ORDERED_STATUS = goog.isDefAndNotNull(opt_status) ?
      [opt_status] : [
        xcov.coverage.Status.COVERED,
        xcov.coverage.Status.PARTIALLY_COVERED,
        xcov.coverage.Status.NOT_COVERED,
        xcov.coverage.Status.EXEMPTED_NO_VIOLATION,
        xcov.coverage.Status.EXEMPTED_WITH_VIOLATION
      ];

  /** @type {number} */ var result = 0;

  goog.array.forEach(ORDERED_STATUS, function(status) {
    if (result !== 0) {
      return;
    }

    if (this.getLineCount(status) !== other.getLineCount(status)) {
      result = this.getLineCount(status) < other.getLineCount(status) ? -1 : 1;
    }
  }, this /* opt_obj */);

  return result;
};
