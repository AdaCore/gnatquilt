/**
 * @fileoverview Provides helper functions for debugging purpose.
 */

goog.provide('xcov.asserts');

goog.require('goog.asserts');


/********************************
 * xcov.asserts.ensureAttribute *
 ********************************/


/**
 * Raises an assertion error if the object does not contains an entry for this
 * attribute.
 *
 * @param {string} attr The attribute to look for.
 * @param {Object} dict The object to check.
 * @param {string} dictName The name for the dictionary.
 */
xcov.asserts.ensureAttribute = function(attr, dict, dictName) {
  goog.asserts.assert(attr in dict,
      'missing "' + attr + '" attribute of ' + dictName);
};
