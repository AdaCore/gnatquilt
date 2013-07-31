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
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.Report');

  /**
   * @type {xcov.Report}
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
  this.setElementInternal(this.getDomHelper().createDom(goog.dom.TagName.DIV,
      goog.getCssName(xcov.style.CSS_CLASS, 'report')));
};
