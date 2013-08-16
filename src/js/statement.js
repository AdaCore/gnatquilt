/**
 * @fileoverview Declares a Statement object.
 */

goog.provide('xcov.Statement');

goog.require('goog.asserts');

goog.require('xcov.AbstractSourceFragment');
goog.require('xcov.Range');


/******************
 * xcov.Statement *
 ******************/



/**
 * A statement structure.
 *
 * @param {number} id Unique identification number.
 * @param {string} text Descriptive text of the statement.
 * @param {!xcov.coverage.Status} coverage The coverage state.
 * @param {!xcov.Range} range Source range.
 * @constructor
 * @extends {xcov.AbstractSourceFragment}
 */
xcov.Statement = function(id, text, coverage, range) {
  goog.base(this, id, text, coverage, range);
};
goog.inherits(xcov.Statement, xcov.AbstractSourceFragment);
