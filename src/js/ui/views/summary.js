/**
 * @fileoverview The report's main view. It displays the source list, ordered by
 * project if such information is available.
 */


goog.provide('xcov.ui.views.Summary');

goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.navigation');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.SourceFileTable');
goog.require('xcov.ui.SourceFileTableHelp');
goog.require('xcov.ui.TotalTable');


/*************************
 * xcov.ui.views.Summary *
 *************************/



/**
 * The summary view component.
 *
 * @param {!xcov.Report} report The coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.views.Summary = function(report, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇧ Show traces table',
          xcov.navigation.getCanonicalTraceTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.TotalTable(report.getSources(), dom),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFileTable(report.getSources(), dom),
      true /* opt_render */);

  this.addChild(new xcov.ui.SourceFileTableHelp(dom), true /* opt_render */);
};
goog.inherits(xcov.ui.views.Summary, goog.ui.Component);
