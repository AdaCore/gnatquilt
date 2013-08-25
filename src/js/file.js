/**
 * @fileoverview A file interface.
 */


goog.provide('xcov.File');

goog.require('goog.Disposable');


/*************
 * xcov.File *
 *************/



/**
 * An interface for a file object.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.File = function() {
  goog.base(this);
};
goog.inherits(xcov.File, goog.Disposable);


/*************************
 * xcov.File.getFilename *
 *************************/


/**
 * @return {string} The path to the file.
 */
xcov.File.prototype.getFilename = goog.abstractMethod;
