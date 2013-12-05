/**
 * @fileoverview An ordered set of project.
 */


goog.provide('xcov.ProjectSet');

goog.require('xcov.Project');
goog.require('xcov.RowableSet');


/*******************
 * xcov.ProjectSet *
 *******************/



/**
 * An ordered set of project.
 *
 * @param {?Array.<!xcov.Project>=} opt_projects Optional initial list of
 *    projects.
 * @constructor
 * @extends {xcov.RowableSet}
 */
xcov.ProjectSet = function(opt_projects) {
  goog.base(this, opt_projects);
};
goog.inherits(xcov.ProjectSet, xcov.RowableSet);


/************************
 * xcov.ProjectSet.sort *
 ************************/


/**
 * Sorts the set into ascending order.
 *
 * @param {?function(!xcov.Project,!xcov.Project):number=} opt_compareFn
 *    Optional comparison function by which the array is to be ordered. Should
 *    take 2 arguments to compare, and return a negative number, zero, or a
 *    positive number depending on whether the first argument is less than,
 *    equal to, or greater than the second.
 */
xcov.ProjectSet.prototype.sort;
