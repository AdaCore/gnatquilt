/**
 * @fileoverview An element that can be represented as a row in a table.
 */


goog.provide('xcov.Rowable');

goog.require('xcov.Enumerable');


/****************
 * xcov.Rowable *
 ****************/



/**
 * A row in a table.
 *
 * @constructor
 * @extends {xcov.Enumerable}
 */
xcov.Rowable = function() {
  goog.base(this);
};
goog.inherits(xcov.Rowable, xcov.Enumerable);


/************************
 * xcov.Rowable.getName *
 ************************/


/**
 * @return {string} The name of that item.
 */
xcov.Rowable.prototype.getName = goog.abstractMethod;
