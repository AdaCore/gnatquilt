/**
 * @fileoverview Encapsulates the logic for a source file.
 */


goog.provide('xcov.SourceFile');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');

goog.require('xcov.CoverageStatus');
goog.require('xcov.SourceLine');


/*******************
 * xcov.SourceFile *
 *******************/



/**
 * Defines a source file.
 *
 * @param {string} filename The source file path.
 * @param {string} coverageLevel The coverage level for the analysis of this
 *    file.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.SourceFile = function(filename, coverageLevel) {
  goog.base(this);

  /**
   * @type {string}
   * @const
   * @private
   */
  this.filename_ = filename;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.coverageLevel_ = coverageLevel;

  /**
   * @type {Object.<string, !xcov.SourceLine>}
   * @const
   * @private
   */
  this.lines_ = {};

  /**
   * Internal index structure used for performance purpose.
   *
   * @type {Object.<xcov.CoverageStatus, Array.<!xcov.SourceLine>>}
   * @const
   * @private
   */
  this.coverage_ = {};

  goog.object.forEach(xcov.CoverageStatus, function(status) {
    goog.object.set(this.coverage_, status, []);
  }, this /* opt_obj */);
};
goog.inherits(xcov.SourceFile, goog.Disposable);


/*******************************
 * xcov.SourceFile.getFilename *
 *******************************/


/**
 * @return {string} The path to the source file.
 */
xcov.SourceFile.prototype.getFilename = function() {
  return goog.string.path.normalizePath(this.filename_);
};


/************************************
 * xcov.SourceFile.getCoverageLevel *
 ************************************/


/**
 * @return {string} The level specified by the coverage report.
 */
xcov.SourceFile.prototype.getCoverageLevel = function() {
  return this.coverageLevel_;
};


/********************************
 * xcov.SourceFile.containsLine *
 ********************************/


/**
 * Returns {@code true} if the file as a line at that line number.
 *
 * @param {number} no The line number.
 * @return {boolean} Whether the file contains a line with the given number.
 */
xcov.SourceFile.prototype.containsLine = function(no) {
  return goog.object.containsKey(this.lines_, no.toString());
};


/***************************
 * xcov.SourceFile.getLine *
 ***************************/


/**
 * Returns the line for that line number if any, {@code null} otherwise.
 *
 * @param {number} no The line number.
 * @param {xcov.SourceLine=} opt_val The value to return if no item is found for
 *    the given key (default is undefined).
 * @return {?xcov.SourceLine} The line for the given number.
 */
xcov.SourceFile.prototype.getLine = function(no, opt_val) {
  /** @const */ var ret =
      goog.object.get(this.lines_, no.toString(), opt_val || null);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/***************************
 * xcov.SourceFile.addLine *
 ***************************/


/**
 * Adds a new line for this source file. Uses the line number to organize
 * internally the line list. Overrides any previously provided line with the
 * same line number.
 *
 * @param {!xcov.SourceLine} line The source line to add to this file.
 */
xcov.SourceFile.prototype.addLine = function(line) {
  goog.object.add(this.lines_, line.getNumber().toString(), line);
  goog.object.get(this.coverage_, line.getCoverage(), null).push(line);
};


/********************************
 * xcov.SourceFile.getLineCount *
 ********************************/


/**
 * Returns the total lines of interest in this file, optionally filtered by
 * coverage status.
 *
 * @param {xcov.CoverageStatus=} opt_coverageStatus Optional coverage status for
 *    filtering.
 * @return {number} The total number of lines in this file, given the input
 *    rules.
 */
xcov.SourceFile.prototype.getLineCount = function(opt_coverageStatus) {
  if (!goog.isDef(opt_coverageStatus)) {
    // Return only the lines that are not tagged as NO_CODE
    return goog.object.getCount(this.lines_) -
        this.getLineCount(xcov.CoverageStatus.NO_CODE);
  }

  return goog.object.get(this.coverage_, opt_coverageStatus, null).length;
};
