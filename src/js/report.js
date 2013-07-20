/**
 * @fileoverview Provides the top-level object to analyse and generate the HTML
 *    coverage report.
 */


goog.provide('xcov.Report');

goog.require('goog.Disposable');
goog.require('goog.debug.Logger');


/***************
 * xcov.Report *
 ***************/



/**
 * A coverage report object. It is capable of analyzing a JSON coverage report
 * and generate the HTML report from it. That report is directly injected into
 * the current HTML page.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.Report = function() {
  goog.base(this);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.Report');
};
goog.inherits(xcov.Report, goog.Disposable);


/***********************
 * xcov.Report.analyse *
 ***********************/


/**
 * Analyzes the input JSON report and generate the HTML report accordingly.
 *
 * @param {Object} input The JSON report to analyse. Do nothing if {@code null}
 *    or {@code undefined}.
 * @return {boolean} {@code true} upon successful analysis, {@code false}
 *    otherwise.
 */
xcov.Report.prototype.analyze = function(input) {
  if (!goog.isDefAndNotNull(input)) {
    this.logger_.severe('Nothing to analyze. Aborting...');
    return false;
  }

  // ???

  return true;
};


/************************
 * xcov.Report.generate *
 ************************/


/**
 * Generates the report corresponding to a previous analysis. Do nothing if
 * {@code xcov.Report#analyze} as not been previously called.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 */
xcov.Report.prototype.generate = function(opt_domHelper) {
  // ???
};
