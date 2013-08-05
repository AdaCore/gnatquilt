/**
 * @fileoverview Provides sorting functions for different data types used in
 *    this project.
 */


goog.provide('xcov.sort');

goog.require('goog.string');

goog.require('xcov.SourceFile');


/************************************
 * xcov.sort.compareSourceFileNames *
 ************************************/


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
xcov.sort.compareSourceFileNames = function(file, other) {
  return goog.string.numerateCompare(file.getFilename(), other.getFilename());
};


/************************************
 * xcov.sort.compareCoverageResults *
 ************************************/


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
xcov.sort.compareCoverageResults = function(file, other) {
  return file.compare(other);
};
