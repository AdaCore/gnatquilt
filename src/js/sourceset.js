/**
 * @fileoverview An ordered set of source files.
 */


goog.provide('xcov.SourceSet');

goog.require('goog.array');
goog.require('goog.asserts');

goog.require('xcov.SourceFile');


/******************
 * xcov.SourceSet *
 ******************/



/**
 * An ordered set of source files.
 *
 * @param {?Array.<!xcov.SourceFile>=} opt_sources Optional initial list
 *    of sources.
 * @constructor
 */
xcov.SourceSet = function(opt_sources) {
  /**
   * @type {Array.<!xcov.SourceFile>}
   * @const
   * @private
   */
  this.sources_ = opt_sources || [];
};


/***********************
 * xcov.SourceSet.push *
 ***********************/


/**
 * Adds a new source file to the set.
 *
 * @param {!xcov.SourceFile} source The source file to add.
 */
xcov.SourceSet.prototype.push = function(source) {
  this.sources_.push(source);
};


/**************************
 * xcov.SourceSet.getSize *
 **************************/


/**
 * @return {number} The size of the set.
 */
xcov.SourceSet.prototype.getSize = function() {
  return this.sources_.length;
};


/**************************
 * xcov.SourceSet.isEmpty *
 **************************/


/**
 * @return {boolean} Whether the set is empty or not.
 */
xcov.SourceSet.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.sources_);
};


/************************************
 * xcov.SourceSet.getTotalLineCount *
 ************************************/


/**
 * Returns the total lines of interest in all files, optionally filtered by
 * coverage status.
 *
 * @param {xcov.coverage.Status=} opt_status Optional coverage status for
 *    filtering.
 * @return {number} The total number of lines in all files, given the input
 *    rules.
 */
xcov.SourceSet.prototype.getTotalLineCount = function(opt_status) {
  var count = 0;

  goog.array.forEach(this.sources_, function(source) {
    count += source.getLineCount(opt_status);
  });

  return count;
};


/*****************************************
 * xcov.SourceSet.getTotalLinePercentage *
 *****************************************/


/**
 * Returns the percentage of line with the given status among the total number
 * of relevant lines.
 *
 * @param {xcov.coverage.Status} status Coverage status for filtering.
 * @return {number} The total number of lines in all files, given the input
 *    rules.
 */
xcov.SourceSet.prototype.getTotalLinePercentage = function(status) {
  /** @const */ var relevantLineCount = this.getTotalLineCount();
  goog.asserts.assert(relevantLineCount !== 0, 'unexpected division by 0');

  return Math.round(this.getTotalLineCount(status) * 100 / relevantLineCount);
};


/**************************
 * xcov.SourceSet.forEach *
 **************************/


/**
 * Calls a function for each source of the set.
 *
 * @param {function(this:T,!xcov.SourceFile,number,!xcov.SourceSet):?} f The
 *    function to call for every source file. The function takes 3 arguments
 *    (the source file, its index in the array and the set). The return value
 *    is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceSet.prototype.forEach = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.array.forEach(this.sources_, function(sources, index) {
    callback(sources, index, this);
  }, this /* opt_obj */);
};


/***********************
 * xcov.SourceSet.sort *
 ***********************/


/**
 * Sorts the source files into ascending order.
 *
 * @param {?function(!xcov.SourceFile,!xcov.SourceFile):number=} opt_compareFn
 *    Optional comparison function by which the array is to be ordered. Should
 *    take 2 arguments to compare, and return a negative number, zero, or a
 *    positive number depending on whether the first argument is less than,
 *    equal to, or greater than the second.
 */
xcov.SourceSet.prototype.sort = function(opt_compareFn) {
  goog.array.sort(this.sources_, opt_compareFn);
};
