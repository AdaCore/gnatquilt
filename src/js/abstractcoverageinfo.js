/**
 * @fileoverview Declares an abstract coverage data object.
 */

goog.provide('xcov.AbstractCoverageInfo');

goog.require('goog.Disposable');
goog.require('goog.asserts');

goog.require('xcov.Range');


/*****************************
 * xcov.AbstractCoverageInfo *
 *****************************/



/**
 * A coverage structure.
 *
 * @param {number} id Unique identification number.
 * @param {string} text Descriptive text for this element.
 * @param {!xcov.coverage.Status} coverage The coverage state.
 * @param {!xcov.Range} range Source range.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.AbstractCoverageInfo = function(id, text, coverage, range) {
  goog.base(this);

  /**
   * @type {number}
   * @private
   * @const
   */
  this.id_ = id;

  /**
   * @type {string}
   * @private
   * @const
   */
  this.text_ = text;

  /**
   * @type {xcov.coverage.Status}
   * @private
   * @const
   */
  this.coverage_ = coverage;

  /**
   * @type {xcov.Range} Range of lines composing the element.
   * @private
   * @const
   */
  this.range_ = range;
};
goog.inherits(xcov.AbstractCoverageInfo, goog.Disposable);


/*****************************************
 * xcov.AbstractCoverageInfo.getUniqueId *
 *****************************************/


/**
 * @return {string} The string representation of the unique ID.
 */
xcov.AbstractCoverageInfo.prototype.getUniqueId = function() {
  return this.id_.toString();
};


/********************************************
 * xcov.AbstractCoverageInfo.getDescription *
 ********************************************/


/**
 * @return {string} Short description of the element.
 */
xcov.AbstractCoverageInfo.prototype.getDescription = function() {
  return this.text_;
};


/***********************************************
 * xcov.AbstractCoverageInfo.getCoverageStatus *
 ***********************************************/


/**
 * @return {xcov.coverage.Status} The level specified by the coverage report.
 */
xcov.AbstractCoverageInfo.prototype.getCoverageStatus = function() {
  return this.coverage_;
};


/**************************************
 * xcov.AbstractCoverageInfo.getRange *
 **************************************/


/**
 * @return {!xcov.Range} The source range for the element.
 */
xcov.AbstractCoverageInfo.prototype.getRange = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.range_), 'compiler check');
  return this.range_;
};
