/**
 * @fileoverview Compilation of all trace files.
 */


goog.provide('xcov.ui.TraceFileList');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.ui.Component');

goog.require('xcov.style');
goog.require('xcov.ui.TraceFileTable');


/*************************
 * xcov.ui.TraceFileList *
 *************************/



/**
 * List all trace files, organized by program that generated them.
 *
 * @param {Array.<!xcov.TraceFile>} traces List of traces from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TraceFileList = function(traces, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {Object.<string,Array.<!xcov.TraceFile>>}
   * @const
   * @private
   */
  this.traces_ = {};

  goog.array.forEach(traces, function(trace) {
    /** @const */ var l = goog.object.get(this.traces_, trace.getProgram(), []);

    l.push(trace);
    goog.object.set(this.traces_, trace.getProgram(), l);
  }, this /* opt_obj */);

  /** @const */ var dom = this.getDomHelper();

  goog.object.forEach(this.traces_, function(traces, program) {
    this.addChild(
        new xcov.ui.TraceFileTable(program, traces, dom),
        true /* opt_render */);
  }, this /* opt_obj */);
};
goog.inherits(xcov.ui.TraceFileList, goog.ui.Component);


/*****************************************
 * xcov.ui.TraceFileList.disposeInternal *
 *****************************************/


/** @inheritDoc */
xcov.ui.TraceFileList.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  goog.object.clear(this.traces_);
};


/***********************************
 * xcov.ui.TraceFileList.createDom *
 ***********************************/


/** @inheritDoc */
xcov.ui.TraceFileList.prototype.createDom = function() {
  this.setElementInternal(this.getDomHelper().createDom(
      goog.dom.TagName.DIV, goog.getCssName(xcov.style.CSS_CLASS, 'traces')));
};
