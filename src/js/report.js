/**
 * @fileoverview Provides the top-level object to analyse and generate the HTML
 *    coverage report.
 */


goog.provide('xcov.Report');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug.Logger');

goog.require('xcov.Trace');


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

  /**
   * @type {Array.<!xcov.Trace>}
   * @private
   */
  this.traces_ = [];
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

  goog.asserts.assert('traces' in input, 'missing "traces" attribute');
  this.analyseTraces_(input['traces']);

  return true;
};


/******************************
 * xcov.Report.analyseTraces_ *
 ******************************/


/**
 * Subroutine that handles the 'traces' field from the JSON report.
 *
 * @param {Array.<!Object>} traces The JSON value for the 'traces' attribute of
 *    the JSON report.
 * @private
 */
xcov.Report.prototype.analyseTraces_ = function(traces) {
  goog.array.forEach(traces, function(trace) {
    goog.asserts.assert('filename' in trace,
        'missing "filename" attribute of trace');

    /** @const */ var filename = trace['filename'];

    goog.asserts.assert('program' in trace,
        'missing "program" attribute of trace');

    /** @const */ var program = trace['program'];

    goog.asserts.assert('date' in trace,
        'missing "date" attribute of trace');

    /** @const */ var date = new Date(trace['date']);

    goog.asserts.assert('tag' in trace,
        'missing "tags" attribute of trace');

    /** @const */ var tags = trace['tag'].toString().split(' ');

    this.traces_.push(new xcov.Trace(filename, program, date, tags));
  }, this /* opt_obj */);
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
