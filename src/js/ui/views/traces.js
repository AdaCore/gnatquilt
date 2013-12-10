/**
 * @fileoverview The list of traces that were used to generate this report.
 */


goog.provide('xcov.ui.views.Traces');

goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.navigation');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.SectionTitle');
goog.require('xcov.ui.TraceFileTable');


/************************
 * xcov.ui.views.Traces *
 ************************/



/**
 * The traces view component.
 *
 * @param {Array.<!xcov.TraceFile>} traces List of traces from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.views.Traces = function(traces, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇪ Back to sources list',
          xcov.navigation.getCanonicalSummaryTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  /**
   * @type {Object.<string,Array.<!xcov.TraceFile>>}
   * @const
   */
  var programs = {};

  goog.array.forEach(traces, function(trace) {
    /** @const */ var l = goog.object.get(programs, trace.getProgram(), []);

    l.push(trace);
    goog.object.set(programs, trace.getProgram(), l);
  }, this /* opt_obj */);

  goog.object.forEach(programs, function(traces, program) {
    this.addChild(
        new xcov.ui.SectionTitle(program, dom),
        true /* opt_render */);

    this.addChild(
        new xcov.ui.TraceFileTable(traces, dom),
        true /* opt_render */);
  }, this /* opt_obj */);
};
goog.inherits(xcov.ui.views.Traces, goog.ui.Component);
