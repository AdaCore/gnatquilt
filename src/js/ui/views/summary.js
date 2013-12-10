/**
 * @fileoverview The report's main view. It displays the source list, ordered by
 * project if such information is available.
 */


goog.provide('xcov.ui.views.Summary');

goog.require('goog.debug.Logger');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.Component');
goog.require('goog.ui.Zippy');

goog.require('xcov.Project');
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

  /**
   * @type {Object.<string,!goog.ui.Zippy>}
   * @const
   * @private
   */
  this.zippies_ = {};

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
      new xcov.ui.TotalTable(report.getSources(), report.hasExempted(), dom),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.ProjectTable(
          report.getProjectSet(), report.hasExempted(), dom),
      true /* opt_render */);

  report.getProjectSet().forEach(function(project) {
    /** @type {goog.ui.Component} */ var title = null;

    if (project.getName() === xcov.Project.NO_PROJECT) {
      title = new xcov.ui.SectionTitle('Other Sources', dom);

      this.logger_.fine(goog.string.buildString('Loading sources associated ',
          'with no project (', project.getSources().getSize(), ')'));

    } else {
      title = new xcov.ui.SectionTitle(project.getName(), dom);

      this.logger_.fine(goog.string.buildString('Loading sources for project: ',
          project, ' (', project.getSources().getSize(), ')'));
    }

    goog.asserts.assert(goog.isDefAndNotNull(title), 'compiler check');

    /** @const */ var titleId =
        xcov.navigation.getProjectAnchor(project.getName());
    /** @const */ var table =
        new xcov.ui.SourceFileTable(
            project.getSources(), report.hasExempted(), dom);

    title.setId(titleId);

    this.addChild(title, true /* opt_render */);
    this.addChild(table, true /* opt_render */);

    var zippy = new goog.ui.Zippy(title.getElement(), table.getElement(),
        true /* opt_expanded */);

    goog.object.set(this.zippies_, titleId, zippy);
  }, this /* opt_obj */);

  this.addChild(new xcov.ui.SourceFileTableHelp(dom), true /* opt_render */);
};
goog.inherits(xcov.ui.views.Summary, goog.ui.Component);


/*************************************
 * xcov.ui.views.Summary.showProject *
 *************************************/


/**
 * Jumps to the source table of the given project.
 *
 * @param {string} project The project to show.
 * @param {Element} container The container in which this widget is rendered.
 */
xcov.ui.views.Summary.prototype.showProject = function(project, container) {
  /** @const */ var titleId = xcov.navigation.getProjectAnchor(project);
  /** @const */ var section = this.getDomHelper().getElement(titleId);

  this.logger_.info(goog.string.buildString('Scrolling to section ',
      project === xcov.Project.NO_PROJECT ? 'Other Sources' : project));

  goog.style.scrollIntoContainerView(section, container, true /* opt_center */);

  /** @const */ var zippy = goog.object.get(this.zippies_, titleId, null);

  if (!goog.isNull(zippy)) {
    zippy.setExpanded(true);
  }
};
