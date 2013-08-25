/**
 * @fileoverview Provides a dynamic table to list the traces extracted from the
 *    report.
 */


goog.provide('xcov.ui.TraceFileTable');

goog.require('goog.array');
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
 * @param {string} program The program used to generate those traces.
 * @param {Array.<!xcov.TraceFile>} traces List of traces from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TraceFileTable = function(program, traces, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {string}
   * @const
   * @private
   */
  this.program_ = program;

  /**
   * @type {Array.<!xcov.TraceFile>}
   * @const
   * @private
   */
  this.traces_ = traces;

  /**
   * @type {Object.<string,!Node>} Table rows stored for easy sorting. This
   *    table is populated in the {@code createDom} method. Keys are filenames.
   * @const
   * @private
   */
  this.rows_ = {};
};
goog.inherits(xcov.ui.TraceFileTable, goog.ui.Component);


/******************************************
 * xcov.ui.TraceFileTable.disposeInternal *
 ******************************************/


/** @inheritDoc */
xcov.ui.TraceFileTable.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  goog.array.clear(this.traces_);
  goog.object.clear(this.rows_);
};


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
          dom.createDom(goog.dom.TagName.TH, {
            'data-tooltip': '<i>The name of the trace file</i>'
          }, 'Trace Filename'),
          dom.createDom(goog.dom.TagName.TH, {
            'data-tooltip': '<i>When it has been generated</i>'
          }, 'Date'),
          dom.createDom(goog.dom.TagName.TH, {
            'data-tooltip': '<i>The tag associated with this run, if any</i>'
          }, 'Tag')));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  goog.array.forEach(this.traces_, function(trace, index) {
    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    /** @const */ var row = dom.createDom(goog.dom.TagName.TR, rowStyle,
        dom.createDom(goog.dom.TagName.TD, null, trace.getFilename()),
        dom.createDom(goog.dom.TagName.TD, null, trace.getFormatedDate()),
        dom.createDom(goog.dom.TagName.TD, null, trace.getTag()));

    dom.appendChild(tableBody, row);
    goog.object.set(this.rows_, trace.getFilename(), row);
  }, this /* opt_obj */);

  dom.appendChild(table, tableBody);

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, null,
      dom.createDom(goog.dom.TagName.H2,
          goog.getCssName(css, 'program'),
          dom.htmlToDocumentFragment('&#10095; ' + this.program_)), table));
};


/****************************************
 * xcov.ui.TraceFileTable.enterDocument *
 ****************************************/


/** @inheritDoc */
xcov.ui.TraceFileTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var thead =
      dom.getFirstElementChild(dom.getLastElementChild(this.getElement()));

  /** @const */ var filenameTitleCell = dom.getFirstElementChild(thead);
  /** @const */ var dateTitleCell =
      dom.getNextElementSibling(filenameTitleCell);

  this.getHandler().listen(filenameTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareFileNames));

  this.getHandler().listen(dateTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareTraceGenerationDate));
};


/***************************************
 * xcov.ui.TraceFileTable.exitDocument *
 ***************************************/


/** @inheritDoc */
xcov.ui.TraceFileTable.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
  this.getHandler().removeAll();
};


/**********************************
 * xcov.ui.TraceFileTable.onSort_ *
 **********************************/


/**
 * On click callback for table headers.
 *
 * @param {?function(!xcov.TraceFile,!xcov.TraceFile):number} compareFn
 *    Comparison function by which the array is to be ordered. Should take 2
 *    arguments to compare, and return a negative number, zero, or a positive
 *    number depending on whether the first argument is less than, equal to, or
 *    greater than the second.
 * @private
 */
xcov.ui.TraceFileTable.prototype.onSort_ = function(compareFn) {
  goog.asserts.assert(!goog.isNull(this.getElement()),
      'Table need to be rendered first');
  goog.asserts.assert(!goog.isNull(this.rows_), 'Missing internal structures');

  /** @const */ var ordered = this.sort(compareFn);

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var tbody = dom.getLastElementChild(this.getElement());

  dom.removeChildren(tbody);

  goog.array.forEach(ordered, function(file, index) {
    /** @const */ var row =
        goog.object.get(this.rows_, file.getFilename(), null /* oopt_val */);

    goog.asserts.assert(goog.isDefAndNotNull(row), 'Unexpected null row');

    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    goog.dom.classes.remove(row, xcov.style.ROW_EVEN_CSS_CLASS);
    goog.dom.classes.remove(row, xcov.style.ROW_ODD_CSS_CLASS);

    goog.dom.classes.add(row, rowStyle);

    dom.appendChild(tbody, row);
  }, this /* opt_obj */);
};


/*******************************
 * xcov.ui.TraceFileTable.sort *
 *******************************/


/**
 * Sorts the trace files into ascending order.
 *
 * @param {?function(!xcov.TraceFile,!xcov.TraceFile):number=} opt_compareFn
 *    Optional comparison function by which the array is to be ordered. Should
 *    take 2 arguments to compare, and return a negative number, zero, or a
 *    positive number depending on whether the first argument is less than,
 *    equal to, or greater than the second.
 * @return {Array.<!xcov.TraceFile>} The array of files sorted given the input
 *    criteria.
 */
xcov.ui.TraceFileTable.prototype.sort = function(opt_compareFn) {
  /** @const */ var copy = goog.array.clone(this.traces_);
  goog.array.sort(copy, opt_compareFn);
  return copy;
};
