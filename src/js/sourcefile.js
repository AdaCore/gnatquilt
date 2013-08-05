/**
 * @fileoverview Encapsulates the logic for a source file.
 */


goog.provide('xcov.SourceFile');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');

goog.require('xcov.SourceLine');
goog.require('xcov.coverage');


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
   * @type {Object.<xcov.coverage.Status, Array.<!xcov.SourceLine>>}
   * @const
   * @private
   */
  this.coverage_ = {};

  goog.object.forEach(xcov.coverage.Status, function(status) {
    goog.object.set(this.coverage_, status.symbol, []);
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
xcov.SourceFile.prototype.getLineAt = function(no, opt_val) {
  /** @const */ var ret =
      goog.object.get(this.lines_, no.toString(), opt_val || null);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/*******************************
 * xcov.SourceFile.forEachLine *
 *******************************/


/**
 * Calls a function for each line in the file. The lines are provided in the
 * correct (increasing) order.
 *
 * @param {?function(this: T, xcov.SourceLine, number, ?): ?} f The function to
 *    call for every line. This function takes 3 argument (the line object, the
 *    index and the source file object). The return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceFile.prototype.forEachLine = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.object.forEach(this.lines_, function(line, index) {
    callback(line, index, this);
  }, this /* opt_obj */);
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
  goog.object.get(this.coverage_, line.getCoverage().symbol, null).push(line);
};


/********************************
 * xcov.SourceFile.getLineCount *
 ********************************/


/**
 * Returns the total lines of interest in this file, optionally filtered by
 * coverage status.
 *
 * @param {xcov.coverage.Status=} opt_coverageStatus Optional coverage status
 *    for filtering.
 * @return {number} The total number of lines in this file, given the input
 *    rules.
 */
xcov.SourceFile.prototype.getLineCount = function(opt_coverageStatus) {
  if (!goog.isDef(opt_coverageStatus)) {
    // Return only the lines that are not tagged as NO_CODE
    return goog.object.getCount(this.lines_) -
        this.getLineCount(xcov.coverage.Status.NO_CODE);
  }

  /** @const */ var lines =
      goog.object.get(this.coverage_, opt_coverageStatus.symbol, null);

  goog.asserts.assert(goog.isDefAndNotNull(lines), 'Unknown coverage status');
  return lines.length;
};


/*************************************
 * xcov.SourceFile.getLinePercentage *
 *************************************/


/**
 * Returns the percentage of line with the given status among the total number
 * of relevant lines.
 *
 * @param {xcov.coverage.Status} coverageStatus Coverage status for filtering.
 * @return {number} The total number of lines in this file, given the input
 *    rules.
 */
xcov.SourceFile.prototype.getLinePercentage = function(coverageStatus) {
  /** @const */ var relevantLineCount = this.getLineCount();
  goog.asserts.assert(relevantLineCount !== 0, 'unexpected division by 0');

  return Math.round(this.getLineCount(coverageStatus) * 100 /
      relevantLineCount);
};


/***************************
 * xcov.SourceFile.compare *
 ***************************/


/**
 * Compares this file against the provided one.
 *
 * @param {!xcov.SourceFile} other The other source file to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.SourceFile.prototype.compare = function(other) {
  /** @const */ var ORDERED_STATUS = [
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

    if (this.getLinePercentage(status) !== other.getLinePercentage(status)) {
      result = this.getLinePercentage(status) <
          other.getLinePercentage(status) ? -1 : 1;
    }
  }, this /* opt_obj */);

  return result;
};
