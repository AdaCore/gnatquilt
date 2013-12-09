/**
 * @fileoverview String utility functions.
 */


goog.provide('xcov.string');

goog.require('goog.array');


/******************************************
 * xcov.string.normalizeHexadecimalNumber *
 ******************************************/


/**
 * Normalizes the string representation of an hexadecimal number.
 *
 * @param {string} hexa The string representation of the number.
 * @return {string} The normalized number, as a string.
 */
xcov.string.normalizeHexadecimal = function(hexa) {
  var idx = 0;

  while (hexa[idx] === '0') {
    idx = idx + 1;
  }

  if (idx === hexa.length) {
    // Only zeros
    return '0x0';
  }

  return '0x' + hexa.substr(idx);
};
