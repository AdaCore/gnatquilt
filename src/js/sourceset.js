/**
 * @fileoverview An ordered set of source files.
 */


goog.provide('xcov.SourceSet');

goog.require('xcov.RowableSet');
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
 * @extends {xcov.RowableSet}
 */
xcov.SourceSet = function(opt_sources) {
  goog.base(this, opt_sources);
};
goog.inherits(xcov.SourceSet, xcov.RowableSet);


/***********************
 * xcov.SourceSet.sort *
 ***********************/


/**
 * Sorts the set into ascending order.
 *
 * @param {?function(!xcov.SourceFile,!xcov.SourceFile):number=} opt_compareFn
 *    Optional comparison function by which the array is to be ordered. Should
 *    take 2 arguments to compare, and return a negative number, zero, or a
 *    positive number depending on whether the first argument is less than,
 *    equal to, or greater than the second.
 */
xcov.SourceSet.prototype.sort;



/**************************
 * xcov.SourceSet.forEach *
 **************************/


/**
 * Calls a function for each project of the set.
 *
 * @param {function(this:T,!xcov.SourceFile,number,!xcov.SourceSet):?} f The
 *    function to call for every row. The function takes 3 arguments
 *    (the row, its index in the array and the set). The return value
 *    is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceSet.prototype.forEach;
