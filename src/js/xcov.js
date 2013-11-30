/**
 * @fileoverview Defines and exposes the coverage report tool entry point.
 *    In particular, make the {@code gnatcov.load_report},
 *    {@code gnatcov.load_hunk} and {@code gnatcov.destroy} symbols public to be
 *    usable within an HTML document.
 */


goog.provide('xcov');

goog.require('goog.debug.ErrorHandler');  // Fix closure missing import
goog.require('goog.dom');
goog.require('goog.string');

goog.require('xcov.Report');
goog.require('xcov.logging');
goog.require('xcov.navigation');
goog.require('xcov.ui.Report');
goog.require('xcov.ui.progress');


/**************
 * xcov.DEBUG *
 **************/


/**
 * @define {boolean} Whether we build the application in debug mode or
 *    production mode. Defaults to production mode.
 */
xcov.DEBUG = true;


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


/*************************
 * xcov.initializeLogger *
 *************************/


/**
 * If not already initialized, setup the logging system. Do nothing otherwise.
 * @private
 */
xcov.initializeLogger_ = function() {
  if (goog.isNull(xcov.logger)) {
    xcov.logging.initialize();
    xcov.logger = goog.debug.Logger.getLogger('xcov');
  }
};


/*******************
 * xcov.loadReport *
 *******************/


/**
 * Creates a {@code xcov.Report} instance to analyses the input JSON report and
 * generate the HTML report accordingly. This function must be called before any
 * use of {@code xcov.loadHunk}.
 *
 * @param {Object} input The JSON report to pass along to the
 *    {@code xcov.Report} instance.
 */
xcov.loadReport = function(input) {
  // Initialize the xcov logging module.

  xcov.initializeLogger_();

  // Create the report object and run the analysis. Generate the HTML report
  // upon successful analysis.

  /** @const */ var report = new xcov.Report();

  if (report.analyze(input)) {
    xcov.htmlReport = new xcov.ui.Report(report, goog.dom.getDomHelper());

    xcov.navigation.initialize(xcov.htmlReport.getDomHelper().getWindow());
    xcov.ui.progress.initialize(xcov.htmlReport.getDomHelper());

    xcov.htmlReport.render();
  }
};


/*****************
 * xcov.loadHunk *
 *****************/


/**
 * Loads and stores the hunk into the {@code xcov.Report} instance. This is used
 * to lazily load pieces of the coverage report. Fails if
 * {@code xcov.loadReport} was not called before.
 *
 * @param {Object} hunk The JSON hunk to load within the {@code xcov.Report}
 *    instance.
 */
xcov.loadHunk = function(hunk) {
  if (goog.isNull(xcov.htmlReport)) {
    // Initialize the logger module if not already done (i.e. in the case where
    // loadHunk has been called before loadReport).
    xcov.initializeLogger_();

    xcov.logger.severe('failed to load the hunk: report badly initialized');

    // ???: display an error message in the document for the user to see.
    return;
  }

  xcov.htmlReport.hunkLoaded(hunk);
};


/****************
 * xcov.destroy *
 ****************/


/**
 * Destroys the current HTML report instance if any.
 */
xcov.destroy = function() {
  if (goog.isNull(xcov.htmlReport)) {
    // Quietly exits if no report exists.
    return;
  }

  // Unregister the navigation mechanism.
  xcov.navigation.finalize();

  // Remove the progress bar widget.
  xcov.ui.progress.finalize();

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
goog.exportSymbol('gnatcov.load_report', xcov.loadReport);

// Use this symbol to load the content of a hunk.
goog.exportSymbol('gnatcov.load_hunk', xcov.loadHunk);

// Use this symbol in the HTML document to destroy the HTML report once
// rendered.
goog.exportSymbol('gnatcov.destroy', xcov.destroy);
