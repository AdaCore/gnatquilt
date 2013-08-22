/**
 * @fileoverview Provides sorting functions for different data types used in
 *    this project.
 */


goog.provide('xcov.sort');

goog.require('goog.string');

goog.require('xcov.SourceFile');


/******************************
 * xcov.sort.compareFileNames *
 ******************************/


/**
 * Compares two source files using their filename.
 *
 * @param {!xcov.SourceFile} file The source file.
 * @param {!xcov.SourceFile} other The other source file to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareFileNames = function(file, other) {
  return goog.string.numerateCompare(file.getFilename(), other.getFilename());
};


/******************************
 * xcov.sort.compareLineCount *
 ******************************/


/**
 * Compares two files using the total line count.
 *
 * @param {!xcov.SourceFile} file The source file.
 * @param {!xcov.SourceFile} other The other source file to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareLineCount = function(file, other) {
  /** @const */ var fileCount = file.getLineCount();
  /** @const */ var otherCount = other.getLineCount();

  if (fileCount === otherCount) {
    return 0;
  }

  return fileCount < otherCount ? -1 : 1;
};


/**********************************
 * xcov.sort.compareCoverageCount *
 **********************************/


/**
 * Compares two files using the results for the given status.
 *
 * @param {!xcov.coverage.Status} status The status to use for comparison.
 * @param {!xcov.SourceFile} file The source file.
 * @param {!xcov.SourceFile} other The other source file to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareCoverageCount = function(status, file, other) {
  return file.compareCount(other, status);
};


/***************************************
 * xcov.sort.compareCoveragePercentage *
 ***************************************/


/**
 * Compares two coverage results set.
 *
 * @param {!xcov.SourceFile} file The source file.
 * @param {!xcov.SourceFile} other The other source file to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareCoveragePercentage = function(file, other) {
  return file.comparePercentage(other);
};
