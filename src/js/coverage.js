/**
 * @fileoverview Enumerates known coverage result kinds.
 */


goog.provide('xcov.coverage');

goog.require('goog.asserts');
goog.require('goog.object');

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
  NOT_COVERABLE: {
    image: 'Not Coverable',
    style: 'not-coverable',
    internalImage: 'not_coverable',
    symbol: '0',
    displaySymbol: '0'
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


/*******************************
 * xcov.coverage.forEachStatus *
 *******************************/


/**
 * Calls a function for each status.
 *
 * @param {?function(this:T,!xcov.coverage.Status,number):?} f The function to
 *    call for every status. This function takes 2 argument (the status
 *    and the index). The return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @param {boolean=} opt_withExempted Whether to display the exemption-related
 *    status or not.
 * @template T
 */
xcov.coverage.forEachStatus = function(f, opt_obj, opt_withExempted) {
  /** @const */ var withExempted = goog.isDefAndNotNull(opt_withExempted) ?
      opt_withExempted : true;
  /** @const */ var callback = goog.bind(f, opt_obj);

  var count = 0;

  goog.object.forEach(xcov.coverage.Status, function(status) {
    if (status === xcov.coverage.Status.NO_CODE) {
      return;
    }

    if (!withExempted &&
        (status === xcov.coverage.Status.EXEMPTED_NO_VIOLATION ||
         status === xcov.coverage.Status.EXEMPTED_WITH_VIOLATION))
    {
      return;
    }

    callback(status, count);
    count = count + 1;
  });
};
