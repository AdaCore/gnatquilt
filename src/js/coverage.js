/**
 * @fileoverview Enumerates known coverage result kinds.
 */


goog.provide('xcov.coverage');

goog.require('xcov.style');


/***************************
 * xcov.coverage.CSS_CLASS *
 ***************************/


/**
 * @type {string} Base CSS class for the coverage statuses.
 */
xcov.coverage.CSS_CLASS = goog.getCssName(xcov.style.CSS_CLASS, 'coverage');


/************************
 * xcov.coverage.Status *
 ************************/


/** @enum {{image: string, style: string, symbol: string}} */
xcov.coverage.Status = {
  NO_CODE: {
    image: 'No Code',
    style: 'no-code',
    symbol: '.',
    displaySymbol: '·'
  },
  COVERED: {
    image: 'Covered',
    style: 'covered',
    symbol: '+',
    displaySymbol: '+'
  },
  PARTIALLY_COVERED: {
    image: 'Partially Covered',
    style: 'partially-covered',
    symbol: '!',
    displaySymbol: '!'
  },
  NOT_COVERED: {
    image: 'Not Covered',
    style: 'not-covered',
    symbol: '-',
    displaySymbol: '-'
  },
  EXEMPTED_NO_VIOLATION: {
    image: 'Exempted, No Violation',
    style: 'exempted-no-violation',
    symbol: '#',
    displaySymbol: '#'
  },
  EXEMPTED_WITH_VIOLATION: {
    image: 'Exempted, With Violations',
    style: 'exempted-with-violation',
    symbol: '*',
    displaySymbol: '*'
  }
};


/****************************
 * xcov.coverage.fromSymbol *
 ****************************/


/**
 * Returns the adequate status constant for the given symbol.
 *
 * @param {string} symbol The symbol as specified in the report.
 * @return {xcov.coverage.Status} The correct status for the given symbol.
 */
xcov.coverage.fromSymbol = function(symbol) {
  /** @type {?xcov.coverage.Status} */ var status = null;

  goog.object.forEach(xcov.coverage.Status, function(value) {
    if (value.symbol === symbol) {
      status = value;
    }
  });

  goog.asserts.assert(goog.isDefAndNotNull(status), 'unknown coverage symbol');
  return /** @type {!xcov.coverage.Status} */ (status);
};
