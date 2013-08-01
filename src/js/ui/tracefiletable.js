/**
 * @fileoverview Provides a dynamic table to list the traces extracted from the
 *    report.
 */


goog.provide('xcov.ui.TraceFileTable');

goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.TraceFile');
goog.require('xcov.style');


/**************************
 * xcov.ui.TraceFileTable *
 **************************/



/**
 * A trace table displaying the list of traces and providing high-level
 * functionalities such as column sorting.
 *
 * @param {Array.<!xcov.TraceFile>} traces List of traces from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TraceFileTable = function(traces, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.TraceFileTable');

  /**
   * @type {Array.<!xcov.TraceFile>}
   * @const
   * @private
   */
  this.traces_ = traces;
};
goog.inherits(xcov.ui.TraceFileTable, goog.ui.Component);


/************************************
 * xcov.ui.TraceFileTable.createDom *
 ************************************/


/** @inheritDoc */
xcov.ui.TraceFileTable.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var css = goog.getCssName(xcov.style.CSS_CLASS, 'traces');
  /** @const */ var tableCss = goog.getCssName(css, 'table');

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE, tableCss,
      dom.createDom(goog.dom.TagName.THEAD, null,
          dom.createDom(goog.dom.TagName.TH, null, 'Trace Filename'),
          dom.createDom(goog.dom.TagName.TH, null, 'Program'),
          dom.createDom(goog.dom.TagName.TH, null, 'Date'),
          dom.createDom(goog.dom.TagName.TH, null, 'Tag')));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  goog.array.forEach(this.traces_, function(trace, index) {
    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    /** @const */ var row = dom.createDom(goog.dom.TagName.TR, rowStyle,
        dom.createDom(goog.dom.TagName.TD, null, trace.getFilename()),
        dom.createDom(goog.dom.TagName.TD, null, trace.getProgram()),
        dom.createDom(goog.dom.TagName.TD, null, trace.getFormatedDate()),
        dom.createDom(goog.dom.TagName.TD, null, trace.getTag()));

    dom.appendChild(tableBody, row);
  });

  dom.appendChild(table, tableBody);
  this.setElementInternal(table);
};
