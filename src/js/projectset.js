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


/***************************
 * xcov.ProjectSet.forEach *
 ***************************/


/**
 * Calls a function for each project of the set.
 *
 * @param {function(this:T,!xcov.Project,number,!xcov.ProjectSet):?} f The
 *    function to call for every row. The function takes 3 arguments
 *    (the row, its index in the array and the set). The return value
 *    is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 * @override
 */
xcov.ProjectSet.prototype.forEach = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);
  var noProject = null;

  goog.array.forEach(this.getSetInternal(), function(project, index) {
    project = /** @type {!xcov.Project} */ (project);

    if (project.getName() === xcov.Project.NO_PROJECT) {
      noProject = project;
      return;
    }

    callback(project, index, this);
  }, this /* opt_obj */);

  if (!goog.isNull(noProject)) {
    callback(/** @type {!xcov.Project} */ (noProject),
        this.getSetInternal().length - 1, this);
  }
};
