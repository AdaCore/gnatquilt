/**
 * @fileoverview Defines and exposes the coverage report tool entry point.
 *    In particular, make the {@code xcov.analyse} symbol public to be usable
 *    within an HTML document.
 */


goog.provide('xcov');

goog.require('goog.debug.ErrorHandler');  // Fix closure missing import
goog.require('goog.dom');
goog.require('goog.string');

goog.require('xcov.Report');
goog.require('xcov.logging');
goog.require('xcov.navigation');
goog.require('xcov.ui.Report');


/*******************
 * xcov.htmlReport *
 *******************/


/**
 * @type {xcov.ui.Report} HTML report instance.
 */
xcov.htmlReport = null;


/***************
 * xcov.logger *
 ***************/


/**
 * @type {goog.debug.Logger}
 */
xcov.logger = null;


/*******************
 * xcov.getCssName *
 *******************/


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * @param {string} className The class name.
 * @param {string} modifier A modifier to be appended to the class name.
 * @return {string} The concatenation of the class name and the
 *    modifier.
 */
xcov.getCssName = function(className, modifier) {
  return goog.string.buildString(className, '-', modifier);
};


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
  xcov.logger = goog.debug.Logger.getLogger('xcov');

  // Create the report object and run the analysis. Generate the HTML report
  // upon successful analysis.

  /** @const */ var report = new xcov.Report();

  if (report.analyze(input)) {
    xcov.htmlReport = new xcov.ui.Report(report, goog.dom.getDomHelper());

    xcov.navigation.initialize(xcov.htmlReport.getDomHelper().getWindow());
    xcov.htmlReport.render();

    xcov.logger.info('HTML report rendered');
  }
};


/****************
 * xcov.destroy *
 ****************/


/**
 * Destroyes the current HTML report instance if any.
 */
xcov.destroy = function() {
  if (goog.isNull(xcov.htmlReport)) {
    // Quietly exits if no report exists.
    return;
  }

  // Unregister the navigation mechanism.
  xcov.navigation.finalize();

  // Remove the report from the current document and dispose it.
  xcov.htmlReport.exitDocument();

  if (xcov.htmlReport.getElement()) {
    goog.dom.removeNode(xcov.htmlReport.getElement());
  }

  goog.dispose(xcov.htmlReport);
  xcov.htmlReport = null;
};


// Exposes an unobfuscated global namespace path for the given object. Note that
// fields of the exported object *will* be obfuscated.

// Use this symbol in the HTML document to generate the report.
goog.exportSymbol('xcov.analyse', xcov.analyze);

// Use this symbol in the HTML document to destroy the HTML report once
// rendered.
goog.exportSymbol('xcov.destroy', xcov.destroy);
