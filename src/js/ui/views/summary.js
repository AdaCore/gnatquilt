/**
 * @fileoverview The report's main view. It displays the source list, ordered by
 * project if such information is available.
 */


goog.provide('xcov.ui.views.Summary');

goog.require('goog.debug.Logger');
goog.require('goog.string');
goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.navigation');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.ProjectTable');
goog.require('xcov.ui.SectionTitle');
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

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.views.Summary');

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇧ Show traces table',
          xcov.navigation.getCanonicalTraceTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SectionTitle('Overview', dom),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.TotalTable(report.getSources(), dom),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.ProjectTable(report.getProjectSet(), dom),
      true /* opt_render */);

  report.forEachProject(function(project, sources) {
    /** @type {goog.ui.Component} */ var title = null;

    if (goog.isNull(project)) {
      title = new xcov.ui.SectionTitle('Other Sources', dom);

      this.logger_.fine(goog.string.buildString('Loading sources associated ',
          'with no project (', sources.getSize(), ')'));
    } else {
      title = new xcov.ui.SectionTitle(project, dom);

      this.logger_.fine(goog.string.buildString('Loading sources for project: ',
          project, ' (', sources.getSize(), ')'));
    }

    goog.asserts.assert(goog.isDefAndNotNull(title), 'compiler check');

    this.addChild(title, true /* opt_render */);
    this.addChild(
        new xcov.ui.SourceFileTable(sources, dom),
        true /* opt_render */);
  }, this /* opt_obj */);

  this.addChild(new xcov.ui.SourceFileTableHelp(dom), true /* opt_render */);
};
goog.inherits(xcov.ui.views.Summary, goog.ui.Component);
