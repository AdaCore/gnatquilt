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

  /** @const */ var dom = this.getDomHelper();

  this.addChild(
      new xcov.ui.TraceFileTable(this.report_.getTraces(), dom),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFileTable(this.report_.getSources(), dom),
      true /* opt_render */);
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


/************************************
 * xcov.ui.Report.getContentElement *
 ************************************/


/** @inheritDoc */
xcov.ui.Report.prototype.getContentElement = function() {
  return this.getDomHelper().getLastElementChild(this.getElement());
};


/******************************
 * xcov.ui.Report.showSummary *
 ******************************/


/**
 * Displays the report summary.
 */
xcov.ui.Report.prototype.showSummary = function() {
  // ???
};


/*********************************
 * xcov.ui.Report.showSourceFile *
 *********************************/


/**
 * Displays the source file for the given filename, or an error page if no
 * source file can be found for that filename.
 *
 * @param {string} filename The source file name.
 */
xcov.ui.Report.prototype.showSourceFile = function(filename) {
  // ???
};
