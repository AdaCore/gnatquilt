/**
 * @fileoverview Top-level UI element.
 */


goog.provide('xcov.ui.Report');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.style');
goog.require('xcov.ui.Help');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.SourceFile');
goog.require('xcov.ui.SourceFileTable');
goog.require('xcov.ui.TraceFileTable');


/******************
 * xcov.ui.Report *
 ******************/



/**
 * Top-level UI element aggregating the sub-components.  It generates the HTML
 * report from it. That report is directly injected into the current HTML page.
 *
 * @param {!xcov.Report} report The analysed coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.Report = function(report, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.Report');

  /**
   * @type {xcov.Report}
   * @const
   * @private
   */
  this.report_ = report;
};
goog.inherits(xcov.ui.Report, goog.ui.Component);


/****************************
 * xcov.ui.Report.createDom *
 ****************************/


/** @inheritDoc */
xcov.ui.Report.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var css = goog.getCssName(xcov.style.CSS_CLASS, 'report');

  /** @const */ var titleDom =
      dom.createDom(goog.dom.TagName.H1, goog.getCssName(css, 'title'),
          'GNATcoverage report');

  /** @const */ var levelDom =
      dom.createDom(goog.dom.TagName.H2, goog.getCssName(css, 'coverage-level'),
          'Coverage level: ' + this.report_.getCoverageLevel());

  /** @const */ var contentDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(css, 'content'));

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV, css, titleDom, levelDom, contentDom));
};


/********************************
 * xcov.ui.Report.enterDocument *
 ********************************/


/** @inheritDoc */
xcov.ui.Report.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  /** @const */ var handler = this.getHandler();

  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.SUMMARY,
      this.handleSummaryViewEvent);
  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.SOURCE,
      this.handleSourceViewEvent);
  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.TRACES,
      this.handleTracesViewEvent);

  xcov.navigation.setEnabled(true);
};


/*******************************
 * xcov.ui.Report.exitDocument *
 *******************************/


/** @inheritDoc */
xcov.ui.Report.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');

  xcov.navigation.setEnabled(false);
  this.getHandler().removeAll();
};


/************************************
 * xcov.ui.Report.getContentElement *
 ************************************/


/** @inheritDoc */
xcov.ui.Report.prototype.getContentElement = function() {
  return this.getDomHelper().getLastElementChild(this.getElement());
};


/*****************************************
 * xcov.ui.Report.handleSummaryViewEvent *
 *****************************************/


/**
 * Displays the report summary.
 *
 * @param {xcov.navigation.Event} e The navigation event.
 * @protected
 */
xcov.ui.Report.prototype.handleSummaryViewEvent = function(e) {
  goog.disposeAll(this.removeChildren(true /* opt_unrender */));

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇧ Show traces table',
          xcov.navigation.getCanonicalTraceTableURL()),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFileTable(this.report_.getSources(), dom),
      true /* opt_render */);

  this.addChild(new xcov.ui.Help(dom), true /* opt_render */);

  this.logger_.info('Navigated to summary view.');
};


/****************************************
 * xcov.ui.Report.handleTracesViewEvent *
 ****************************************/


/**
 * Displays the traces table.
 *
 * @param {xcov.navigation.Event} e The navigation event.
 * @protected
 */
xcov.ui.Report.prototype.handleTracesViewEvent = function(e) {
  goog.disposeAll(this.removeChildren(true /* opt_unrender */));

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇧ Up to sources list',
          xcov.navigation.getCanonicalSummaryTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.TraceFileTable(this.report_.getTraces(), dom),
      true /* opt_render */);

  this.logger_.info('Navigated to traces table.');
};


/****************************************
 * xcov.ui.Report.handleSourceViewEvent *
 ****************************************/


/**
 * Displays the source file for the given filename, or an error page if no
 * source file can be found for that filename.
 *
 * @param {xcov.navigation.Event} e The navigation event.
 * @protected
 */
xcov.ui.Report.prototype.handleSourceViewEvent = function(e) {
  if (!goog.isDefAndNotNull(e.filename)) {
    this.logger_.warning('Unexpected empty value for source filename.');
    this.logger_.warning('Fallback on summary view.');
    this.handleSummaryViewEvent(e);
    return;
  }

  /** @const */ var source = this.report_.getSource(e.filename);

  if (goog.isNull(source)) {
    this.logger_.warning('Unknown source file name: ' + e.filename);
    this.logger_.warning('Fallback on summary view.');
    this.handleSummaryViewEvent(e);
    return;
  }

  goog.disposeAll(this.removeChildren(true /* opt_unrender */));

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.Navigation(
          '⇧ Up to sources list',
          xcov.navigation.getCanonicalSummaryTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFileTable([source], this.getDomHelper()),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFile(source, this.getDomHelper()),
      true /* opt_render */);

  this.logger_.info('Navigated to source file: ' + e.filename);
};
