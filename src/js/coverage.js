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


/** @enum {{sym: string, image: string}} */
xcov.coverage.Status = {
  NO_CODE: {
    sym: '.',
    image: 'No Code',
    style: 'no-code'
  },
  COVERED: {
    sym: '+',
    image: 'Covered',
    style: 'covered'
  },
  PARTIALLY_COVERED: {
    sym: '!',
    image: 'Partially Covered',
    style: 'partially-covered'
  },
  NOT_COVERED: {
    sym: '-',
    image: 'Not Covered',
    style: 'not-covered'
  },
  EXEMPTED_NO_VIOLATION: {
    sym: '#',
    image: 'Exempted, No Violation',
    style: 'exempted-no-violation'
  },
  EXEMPTED_WITH_VIOLATION: {
    sym: '*',
    image: 'Exempted, Violations',
    style: 'exempted-with-violations'
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
    if (value.sym === symbol) {
      status = value;
    }
  });

  goog.asserts.assert(goog.isDefAndNotNull(status), 'unknown coverage symbol');
  return /** @type {!xcov.coverage.Status} */ (status);
};
