/**
 * @fileoverview Provides utility functions for the various table in the
 *    report.
 */


goog.provide('xcov.ui.TableUtils');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.string');

goog.require('xcov.Enumerable');
goog.require('xcov.coverage');
goog.require('xcov.style');


/********************************
 * xcov.ui.TableUtils.CSS_CLASS *
 ********************************/


/**
 * @type {string} Default CSS class for a table.
 */
xcov.ui.TableUtils.CSS_CLASS = goog.getCssName(xcov.style.CSS_CLASS, 'table');


/*******************************************
 * xcov.ui.TableUtils.COUNT_CELL_CSS_CLASS *
 *******************************************/


/**
 * @type {string} Default CSS class for a cell containing a count.
 */
xcov.ui.TableUtils.COUNT_CELL_CSS_CLASS =
    goog.getCssName(xcov.ui.TableUtils.CSS_CLASS, 'count');


/**************************************
 * xcov.ui.TableUtils.createTableHead *
 **************************************/


/**
 * Creates the table header.
 *
 * @param {null|string|Element} label Label to use for the first column.
 * @param {goog.dom.DomHelper} dom DOM helper to use to create the final
 *    element.
 * @return {Element} The DOM element.
 */
xcov.ui.TableUtils.createTableHead = function(label, dom) {
  /** @const */ var countCellStyle = xcov.ui.TableUtils.COUNT_CELL_CSS_CLASS;

  return dom.createDom(goog.dom.TagName.THEAD, null,
      dom.createDom(goog.dom.TagName.TH, null, label),
      dom.createDom(goog.dom.TagName.TH, countCellStyle, 'Total lines'),
      dom.createDom(goog.dom.TagName.TH, countCellStyle,
          xcov.coverage.Status.COVERED.image),
      dom.createDom(goog.dom.TagName.TH, countCellStyle,
          xcov.coverage.Status.PARTIALLY_COVERED.image),
      dom.createDom(goog.dom.TagName.TH, countCellStyle,
          xcov.coverage.Status.NOT_COVERED.image),
      dom.createDom(goog.dom.TagName.TH, countCellStyle,
          xcov.coverage.Status.EXEMPTED_NO_VIOLATION.image),
      dom.createDom(goog.dom.TagName.TH, countCellStyle,
          xcov.coverage.Status.EXEMPTED_WITH_VIOLATION.image),
      dom.createDom(goog.dom.TagName.TH, null, 'Summary'));
};


/*************************************
 * xcov.ui.TableUtils.createTableRow *
 *************************************/


/**
 * Creates the table row.
 *
 * @param {null|string|Element} label Label to use for the first column.
 * @param {!xcov.Enumerable} enumerable Either a source file or
 *    a source set.
 * @param {goog.dom.DomHelper} dom DOM helper to use to create the final
 *    element.
 * @param {?number=} opt_index Optional index to handle row style.
 * @return {Element} The DOM element.
 */
xcov.ui.TableUtils.createTableRow = function(label, enumerable, dom,
    opt_index) {

  /** @type {?string} */ var rowStyle = null;

  if (goog.isDefAndNotNull(opt_index)) {
    rowStyle = opt_index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;
  }

  /**
   * Returns a string representation of the total lines of interest in this
   * file, filtered by coverage status.
   *
   * @param {xcov.coverage.Status} status Coverage status for filtering.
   * @return {Element} The DOM representation of the total number of lines
   *    in this source file, given the input rules.
   * @private
   */
  function format_(status) {
    /** @const */ var count = enumerable.getLineCount(status);
    /** @const */ var percent = enumerable.getLinePercentage(status);

    return dom.createDom(goog.dom.TagName.DIV,
        goog.getCssName(xcov.ui.TableUtils.CSS_CLASS, 'cell'),
        dom.createDom(goog.dom.TagName.SPAN, null, count.toString()),
        dom.createDom(goog.dom.TagName.SPAN, null,
            (percent || 0).toString() + '%'));
  };

  /** @const */ var countCellStyle = xcov.ui.TableUtils.COUNT_CELL_CSS_CLASS;

  return dom.createDom(goog.dom.TagName.TR, rowStyle,
      dom.createDom(goog.dom.TagName.TD,
          goog.getCssName(xcov.ui.TableUtils.CSS_CLASS, 'filename'), label),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          enumerable.getLineCount().toString()),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          format_(xcov.coverage.Status.COVERED)),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          format_(xcov.coverage.Status.PARTIALLY_COVERED)),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          format_(xcov.coverage.Status.NOT_COVERED)),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          format_(xcov.coverage.Status.EXEMPTED_NO_VIOLATION)),
      dom.createDom(goog.dom.TagName.TD, countCellStyle,
          format_(xcov.coverage.Status.EXEMPTED_WITH_VIOLATION)),
      dom.createDom(goog.dom.TagName.TD,
          goog.getCssName(xcov.ui.TableUtils.CSS_CLASS, 'summary'),
          xcov.ui.TableUtils.createCoverageSummaryDom(enumerable, dom)));
};


/**********************************
 * xcov.ui.TableUtils.setRowStyle *
 **********************************/


/**
 * Sets the correct row style given its index. Useful after a table sort.
 *
 * @param {!Node} row The row on which to apply the style.
 * @param {number} index The new index for this row.
 */
xcov.ui.TableUtils.setRowStyle = function(row, index) {
  /** @const */ var rowStyle = index % 2 === 0 ?
      xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

  goog.dom.classes.remove(row, xcov.style.ROW_EVEN_CSS_CLASS);
  goog.dom.classes.remove(row, xcov.style.ROW_ODD_CSS_CLASS);

  goog.dom.classes.add(row, rowStyle);
};


/***********************************************
 * xcov.ui.TableUtils.createCoverageSummaryDom *
 ***********************************************/


/**
 * Creates and returns a DOM element that visually represent the coverage level
 * for the given source or set of source.
 *
 * @param {!xcov.Enumerable} enumerable Either a source file or
 *    a source set.
 * @param {goog.dom.DomHelper} dom DOM helper to use to create the final
 *    element.
 * @return {Element} The DOM element.
 */
xcov.ui.TableUtils.createCoverageSummaryDom = function(enumerable, dom) {
  /** @const */ var row = dom.createDom(goog.dom.TagName.TR, null);
  /** @const */ var style = goog.getCssName(xcov.style.CSS_CLASS, 'summary');

  goog.object.forEach(xcov.coverage.Status, function(status) {
    /** @const */ var count = enumerable.getLineCount(status);

    if (status === xcov.coverage.Status.NO_CODE || count === 0) {
      // Display only relevant lines of code
      return null;
    }

    // NOTE: We do not use the percent value in the condition above to avoid
    // triggering a division-by-zero assertion. This case should not happen
    // unless some bug gets its way until here. In this very case, this code
    // won't raise an error (given that if the line count for this status is
    // equal to 0, then the total number of lines should be 0).

    /** @const */ var percent = enumerable.getLinePercentage(status);

    if (percent !== 0) {
      /** @const */ var cell = dom.createDom(goog.dom.TagName.TD, {
        'class': xcov.getCssName(style, status.style),
        'width': goog.string.buildString(percent, '%'),
        'data-tooltip': goog.string.buildString(percent, '% ', status.image)
      });

      dom.appendChild(row, cell);
    }
  });

  if (dom.getChildren(row).length === 0) {
    dom.appendChild(row, dom.createDom(goog.dom.TagName.TD, {
      'class': goog.getCssName(style, 'not-applicable'),
      'width': '100%',
      'data-tooltip': 'Not Applicable'
    }));
  }

  return dom.createDom(goog.dom.TagName.TABLE, style,
      dom.createDom(goog.dom.TagName.TBODY, null, row));
};
