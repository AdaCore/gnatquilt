/**
 * @fileoverview Defines and exposes the coverage report tool entry point.
 *    In particular, make the {@code xcov.analyse} symbol public to be usable
 *    within an HTML document.
 */


goog.provide('xcov');

goog.require('goog.dom');

goog.require('xcov.Report');
goog.require('xcov.logging');


/****************
 * xcov.analyse *
 ****************/


/**
 * Creates a {@code xcov.Report} instance to analyses the input JSON report and
 * generate the HTML report accordingly.
 *
 * @param {Object} input The JSON report to pass along to the
 *    {@code xcov.Report} instance.
 */
xcov.analyze = function(input) {
  // Initialize the xcov logging module.
  xcov.logging.initialize();

  // Create the report object and run the analysis. Generate the HTML report
  // upon successful analysis.

  /** @const */ var report = new xcov.Report();

  if (report.analyze(input)) {
    console.log(report.traces_);
    report.generate(goog.dom.getDomHelper());
  }
};


// Exposes an unobfuscated global namespace path for the given object. Note that
// fields of the exported object *will* be obfuscated.
//
// Use this symbol in the HTML document to generate the report.
goog.exportSymbol('xcov.analyse', xcov.analyze);
