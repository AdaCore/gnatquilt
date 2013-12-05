/**
 * @fileoverview Provides sorting functions for different data types used in
 *    this project.
 */


goog.provide('xcov.sort');

goog.require('goog.string');

goog.require('xcov.Enumerable');
goog.require('xcov.SourceFile');
goog.require('xcov.TraceFile');


/******************************
 * xcov.sort.compareFileNames *
 ******************************/


/**
 * Compares two files using their filename.
 *
 * @param {!xcov.SourceFile|!xcov.TraceFile} file The file.
 * @param {!xcov.SourceFile|!xcov.TraceFile} other The other file to
 *    compare the first one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareFileNames = function(file, other) {
  return goog.string.numerateCompare(file.getFilename(), other.getFilename());
};


/*************************
 * xcov.sort.compareName *
 *************************/


/**
 * Compares two rowable using their name.
 *
 * @param {!xcov.Rowable} rowable The rowable.
 * @param {!xcov.Rowable} other The other rowable to compare the first one
 *    against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareName = function(rowable, other) {
  return goog.string.numerateCompare(rowable.getName(), other.getName());
};


/****************************************
 * xcov.sort.compareTraceGenerationDate *
 ****************************************/


/**
 * Compares two trace files using their generation date.
 *
 * @param {!xcov.TraceFile} file The file.
 * @param {!xcov.TraceFile} other The other file to compare the first one
 *    against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareTraceGenerationDate = function(file, other) {
  return goog.string.numerateCompare(file.getFormatedDate(),
      other.getFormatedDate());
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
 * Compares two enumerables using the results for the given status.
 *
 * @param {!xcov.coverage.Status} status The status to use for comparison.
 * @param {!xcov.Enumerable} enumerable The enumerable.
 * @param {!xcov.Enumerable} other The other enumerable to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareCoverageCount = function(status, enumerable, other) {
  return enumerable.compareCount(other, status);
};


/*********************************************
 * xcov.sort.compareCoveragePercentageStatus *
 *********************************************/


/**
 * Compares two enumerables using the results for the given status.
 *
 * @param {!xcov.coverage.Status} status The status to use for comparison.
 * @param {!xcov.Enumerable} enumerable The enumerable.
 * @param {!xcov.Enumerable} other The other enumerable to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareCoverageStatusPercentage = function(status, enumerable,
    other) {

  return enumerable.comparePercentage(other, status);
};


/***************************************
 * xcov.sort.compareCoveragePercentage *
 ***************************************/


/**
 * Compares two coverage results set.
 *
 * @param {!xcov.Enumerable} enumerable The enumerable.
 * @param {!xcov.Enumerable} other The other enumerable to compare the first
 *    one against.
 * @return {number} a negative number, zero, or a positive number depending on
 *    whether the first argument is less than, equal to, or greater than the
 *    second.
 */
xcov.sort.compareCoveragePercentage = function(enumerable, other) {
  return enumerable.comparePercentage(other);
};
