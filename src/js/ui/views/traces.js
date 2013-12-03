/**
 * @fileoverview The list of traces that were used to generate this report.
 */


goog.provide('xcov.ui.views.Traces');

goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.navigation');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.TraceFileList');


/************************
 * xcov.ui.views.Traces *
 ************************/



/**
 * The traces view component.
 *
 * @param {!xcov.Report} report The coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.views.Traces = function(report, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇪ Up to sources list',
          xcov.navigation.getCanonicalSummaryTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.TraceFileList(report.getTraces(), dom),
      true /* opt_render */);
};
goog.inherits(xcov.ui.views.Traces, goog.ui.Component);
