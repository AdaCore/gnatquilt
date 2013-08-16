/**
 * @fileoverview Declares a Condition object.
 */

goog.provide('xcov.Condition');

goog.require('xcov.AbstractSourceFragment');
goog.require('xcov.Range');


/******************
 * xcov.Condition *
 ******************/



/**
 * A condition structure.
 *
 * @param {number} id Unique identification number.
 * @param {string} text Descriptive text of the condition.
 * @param {!xcov.coverage.Status} coverage The coverage state.
 * @param {!xcov.Range} range Source range.
 * @constructor
 * @extends {xcov.AbstractSourceFragment}
 */
xcov.Condition = function(id, text, coverage, range) {
  goog.base(this, id, text, coverage, range);
};
goog.inherits(xcov.Condition, xcov.AbstractSourceFragment);
