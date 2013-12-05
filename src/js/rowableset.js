/**
 * @fileoverview A set of rowable element.
 */


goog.provide('xcov.RowableSet');

goog.require('goog.array');

goog.require('xcov.Rowable');


/*******************
 * xcov.RowableSet *
 *******************/



/**
 * A set of rowable element.
 *
 * @param {?Array.<!xcov.Rowable>=} opt_set Optional initial set.
 * @constructor
 * @extends {xcov.Enumerable}
 */
xcov.RowableSet = function(opt_set) {
  goog.base(this);

  /**
   * @type {Array.<!xcov.Rowable>}
   * @const
   * @private
   */
  this.set_ = opt_set || [];
};
goog.inherits(xcov.RowableSet, xcov.Enumerable);


/************************
 * xcov.RowableSet.push *
 ************************/


/**
 * Adds a new project to the set.
 *
 * @param {!xcov.Rowable} rowable The rowable to add.
 */
xcov.RowableSet.prototype.push = function(rowable) {
  this.set_.push(rowable);
};


/***************************
 * xcov.RowableSet.getSize *
 ***************************/


/**
 * @return {number} The size of the set.
 */
xcov.RowableSet.prototype.getSize = function() {
  return this.set_.length;
};


/***************************
 * xcov.RowableSet.isEmpty *
 ***************************/


/**
 * @return {boolean} Whether the set is empty or not.
 */
xcov.RowableSet.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.set_);
};


/********************************
 * xcov.RowableSet.getLineCount *
 ********************************/


/** @inheritDoc */
xcov.RowableSet.prototype.getLineCount = function(opt_status) {
  var count = 0;

  goog.array.forEach(this.set_, function(rowable) {
    count += rowable.getLineCount(opt_status);
  });

  return count;
};


/***************************
 * xcov.RowableSet.forEach *
 ***************************/


/**
 * Calls a function for each project of the set.
 *
 * @param {function(this:T,!xcov.Rowable,number,!xcov.RowableSet):?} f The
 *    function to call for every row. The function takes 3 arguments
 *    (the row, its index in the array and the set). The return value
 *    is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.RowableSet.prototype.forEach = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.array.forEach(this.set_, function(rowable, index) {
    callback(rowable, index, this);
  }, this /* opt_obj */);
};


/************************
 * xcov.RowableSet.sort *
 ************************/


/**
 * Sorts the set into ascending order.
 *
 * @param {?function(!xcov.Rowable,!xcov.Rowable):number=} opt_compareFn
 *    Optional comparison function by which the array is to be ordered. Should
 *    take 2 arguments to compare, and return a negative number, zero, or a
 *    positive number depending on whether the first argument is less than,
 *    equal to, or greater than the second.
 */
xcov.RowableSet.prototype.sort = function(opt_compareFn) {
  goog.array.sort(this.set_, opt_compareFn);
};
