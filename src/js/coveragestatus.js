/**
 * @fileoverview Enumerates known coverage result kind.
 */


goog.provide('xcov.CoverageStatus');


/** @enum {string} */
xcov.CoverageStatus = {
  NO_CODE: '.',
  COVERED: '+',
  PARTIALLY_COVERED: '!',
  NOT_COVERED: '-',
  EXEMPTED_NO_VIOLATION: '#',
  EXEMPTED_WITH_VIOLATION: '*'
};
