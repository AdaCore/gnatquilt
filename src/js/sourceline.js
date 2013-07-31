/**
 * @fileoverview Encapsulates the logic for a source line.
 */


goog.provide('xcov.SourceLine');

goog.require('goog.Disposable');

goog.require('xcov.CoverageStatus');


/*******************
 * xcov.SourceLine *
 *******************/



/**
 * Defines a line in a source file.
 *
 * @param {number} no Line number.
 * @param {xcov.CoverageStatus} coverage Coverage value for this line.
 * @param {string} text The content of that line.
 * @param {boolean=} opt_exempted Whether the file has been tagged as exempted
 *    in the coverage report. Defaults to {@code false}.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.SourceLine = function(no, coverage, text, opt_exempted) {
  goog.base(this);

  /**
   * @type {number}
   * @const
   * @private
   */
  this.number_ = no;

  /**
   * @type {xcov.CoverageStatus}
   * @const
   * @private
   */
  this.coverage_ = coverage;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.text_ = text;

  /**
   * @type {boolean}
   * @const
   * @private
   */
  this.exempted_ = opt_exempted || false;
};
goog.inherits(xcov.SourceLine, goog.Disposable);


/*****************************
 * xcov.SourceLine.getNumber *
 *****************************/


/**
 * @return {number} The line number.
 */
xcov.SourceLine.prototype.getNumber = function() {
  return this.number_;
};


/*******************************
 * xcov.SourceLine.getCoverage *
 *******************************/


/**
 * @return {xcov.CoverageStatus} The coverage status for this line.
 */
xcov.SourceLine.prototype.getCoverage = function() {
  return this.coverage_;
};


/***************************
 * xcov.SourceLine.getText *
 ***************************/


/**
 * @return {string} The line content.
 */
xcov.SourceLine.prototype.getText = function() {
  return this.text_;
};


/******************************
 * xcov.SourceLine.isExempted *
 ******************************/


/**
 * @return {boolean} Whether the file has been tagged as exempted in the
 *    coverage report.
 */
xcov.SourceLine.prototype.isExempted = function() {
  return this.exempted_;
};
