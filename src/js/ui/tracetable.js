/**
 * @fileoverview Provides a dynamic table to list the traces extracted from the
 *    report.
 */


goog.provide('xcov.ui.TraceTable');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.Trace');
goog.require('xcov.style');


/**********************
 * xcov.ui.TraceTable *
 **********************/



/**
 * A trace table displaying the list of traces and providing high-level
 * functionalities such as column sorting.
 *
 * @param {Array.<!xcov.Traces>} traces List of traces from the coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TraceTable = function(traces, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.TraceTable');

  /**
   * @type {Array.<!xcov.Trace>}
   * @private
   */
  this.traces_ = traces;
};
goog.inherits(xcov.ui.TraceTable, goog.ui.Component);


/********************************
 * xcov.ui.TraceTable.createDom *
 ********************************/


/** @inheritDoc */
xcov.ui.TraceTable.prototype.createDom = function() {
  this.setElementInternal(this.getDomHelper().createDom(goog.dom.TagName.DIV,
      goog.getCssName(xcov.style.CSS_CLASS, 'traces')));
};
