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


/**
 * @enum {{image:string,style:string,internalImage:string,symbol:string,
 *         displaySymbol:string}}
 */
xcov.coverage.Status = {
  NO_CODE: {
    image: 'No Code',
    style: 'no-code',
    internalImage: 'no_code',
    symbol: '.',
    displaySymbol: '·'
  },
  COVERED: {
    image: 'Covered',
    style: 'covered',
    internalImage: 'covered',
    symbol: '+',
    displaySymbol: '+'
  },
  PARTIALLY_COVERED: {
    image: 'Partially Covered',
    style: 'partially-covered',
    internalImage: 'partially_covered',
    symbol: '!',
    displaySymbol: '!'
  },
  NOT_COVERED: {
    image: 'Not Covered',
    style: 'not-covered',
    internalImage: 'not_covered',
    symbol: '-',
    displaySymbol: '-'
  },
  EXEMPTED_NO_VIOLATION: {
    image: 'Exempted, No Violation',
    style: 'exempted-no-violation',
    internalImage: 'exempted_no_violation',
    symbol: '#',
    displaySymbol: '#'
  },
  EXEMPTED_WITH_VIOLATION: {
    image: 'Exempted, With Violations',
    style: 'exempted-with-violation',
    internalImage: 'exempted_with_violation',
    symbol: '*',
    displaySymbol: '*'
  }
};


/******************************
 * xcov.coverage.BranchStatus *
 ******************************/


/**
 * @enum {{image:string,style:string,internalImage:string,symbol:string,
 *         displaySymbol:string}}
 */
xcov.coverage.BranchStatus = {
  UNKNOWN: {
    image: 'Unknown',
    style: 'unknown',
    internalImage: 'unknown',
    symbol: '?',
    displaySymbol: '?'
  },
  COVERED: {
    image: 'Covered',
    style: 'covered',
    internalImage: 'covered',
    symbol: '+',
    displaySymbol: '+'
  },
  BRANCH_TAKEN: {
    image: 'Branch Taken',
    style: 'partially-covered',
    internalImage: 'branch_taken',
    symbol: '>',
    displaySymbol: '→'
  },
  FALLTHROUGH_TAKEN: {
    image: 'Fallthrough Taken',
    style: 'partially-covered',
    internalImage: 'fallthrough_taken',
    symbol: 'v',
    displaySymbol: '↓'
  },
  NOT_COVERED: {
    image: 'Not Covered',
    style: 'not-covered',
    internalImage: 'not_covered',
    symbol: '-',
    displaySymbol: '-'
  },
  BOTH_TAKEN: {
    image: 'Both Taken',
    style: 'covered',
    internalImage: 'both_taken',
    symbol: '+',
    displaySymbol: '+'
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

  goog.asserts.assert(goog.isDefAndNotNull(status),
      'unknown coverage symbol: "' + symbol + '"');

  return /** @type {!xcov.coverage.Status} */ (status);
};


/**********************************
 * xcov.coverage.fromBranchSymbol *
 **********************************/


/**
 * Returns the adequate branch status constant for the given symbol.
 *
 * @param {string} symbol The symbol as specified in the report.
 * @return {xcov.coverage.BranchStatus} The correct status for the given symbol.
 */
xcov.coverage.fromBranchSymbol = function(symbol) {
  /** @type {?xcov.coverage.BranchStatus} */ var status = null;

  // ???: This loop should never return BOTH_TAKEN since its symbol is the same
  // as COVERED.

  goog.object.forEach(xcov.coverage.BranchStatus, function(value) {
    if (value.symbol === symbol) {
      status = value;
    }
  });

  goog.asserts.assert(goog.isDefAndNotNull(status),
      'unknown coverage symbol: "' + symbol + '"');

  return /** @type {!xcov.coverage.BranchStatus} */ (status);
};
