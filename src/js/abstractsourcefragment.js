/**
 * @fileoverview Declares an abstract coverage data object.
 */

goog.provide('xcov.AbstractSourceFragment');

goog.require('goog.Disposable');
goog.require('goog.asserts');

goog.require('xcov.Range');


/*******************************
 * xcov.AbstractSourceFragment *
 *******************************/



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
xcov.AbstractSourceFragment = function(id, text, coverage, range) {
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
goog.inherits(xcov.AbstractSourceFragment, goog.Disposable);


/*******************************************
 * xcov.AbstractSourceFragment.getUniqueId *
 *******************************************/


/**
 * @return {string} The string representation of the unique ID.
 */
xcov.AbstractSourceFragment.prototype.getUniqueId = function() {
  return this.id_.toString();
};


/**********************************************
 * xcov.AbstractSourceFragment.getDescription *
 **********************************************/


/**
 * @return {string} Short description of the element.
 */
xcov.AbstractSourceFragment.prototype.getDescription = function() {
  return this.text_;
};


/*************************************************
 * xcov.AbstractSourceFragment.getCoverageStatus *
 *************************************************/


/**
 * @return {xcov.coverage.Status} The level specified by the coverage report.
 */
xcov.AbstractSourceFragment.prototype.getCoverageStatus = function() {
  return this.coverage_;
};


/****************************************
 * xcov.AbstractSourceFragment.getRange *
 ****************************************/


/**
 * @return {!xcov.Range} The source range for the element.
 */
xcov.AbstractSourceFragment.prototype.getRange = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.range_), 'compiler check');
  return this.range_;
};
