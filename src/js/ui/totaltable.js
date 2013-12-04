/**
 * @fileoverview Provides a summary table with the total of all metrics.
 */


goog.provide('xcov.ui.TotalTable');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.SourceSet');
goog.require('xcov.style');


/**********************
 * xcov.ui.TotalTable *
 **********************/



/**
 * A table displaying the total for each metrics.
 *
 * @param {!xcov.SourceSet} sources List of sources from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TotalTable = function(sources, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.SourceSet}
   * @const
   * @private
   */
  this.sources_ = sources;
};
goog.inherits(xcov.ui.TotalTable, goog.ui.Component);


/********************************
 * xcov.ui.TotalTable.createDom *
 ********************************/


/** @inheritDoc */
xcov.ui.TotalTable.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style = goog.getCssName(xcov.style.CSS_CLASS, 'total');
  /** @const */ var tableStyle = goog.getCssName(style, 'table');
  /** @const */ var cellStyle = goog.getCssName(tableStyle, 'cell');
  /** @const */ var countCellStyle = goog.getCssName(tableStyle, 'count');
  /** @const */ var summaryCellStyle = goog.getCssName(tableStyle, 'summary');
  /** @const */ var filenameCellStyle = goog.getCssName(tableStyle, 'filename');

  /**
   * Returns a string representation of the total lines of interest in this
   * file, filtered by coverage status.
   *
   * @param {xcov.coverage.Status} coverageStatus Coverage status for
   *    filtering.
   * @return {Element} The DOM representation of the total number of lines
   *    in this source file, given the input rules.
   * @private
   */
  var format_ = goog.bind(function(status) {
    /** @const */ var count = this.sources_.getTotalLineCount(status);
    /** @const */ var percent =
        this.sources_.getTotalLinePercentage(status);

    return dom.createDom(goog.dom.TagName.DIV, cellStyle,
        dom.createDom(goog.dom.TagName.SPAN, null, count.toString()),
        dom.createDom(goog.dom.TagName.SPAN, null,
            (percent || 0).toString() + '%'));
  }, this /* opt_handler */);

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE, tableStyle,
      dom.createDom(goog.dom.TagName.THEAD, null,
          dom.createDom(goog.dom.TagName.TH),
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
          dom.createDom(goog.dom.TagName.TH, null, 'Summary')),
      dom.createDom(goog.dom.TagName.TBODY, null,
          dom.createDom(goog.dom.TagName.TR, null,
              dom.createDom(goog.dom.TagName.TD, filenameCellStyle, 'Total'),
              dom.createDom(goog.dom.TagName.TD, countCellStyle,
                  this.sources_.getTotalLineCount().toString()),
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
              dom.createDom(goog.dom.TagName.TD, summaryCellStyle,
                  this.createCoverageSummaryDom_()))));

  this.setElementInternal(table);
};


/************************************************
 * xcov.ui.TotalTable.createCoverageSummaryDom_ *
 ************************************************/


/**
 * Creates and returns a DOM element that visually represent the coverage level
 * for the given source.
 *
 * @return {?Element} The DOM element.
 * @private
 */
xcov.ui.TotalTable.prototype.createCoverageSummaryDom_ = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var row = dom.createDom(goog.dom.TagName.TR, null);
  /** @const */ var style = goog.getCssName(xcov.style.CSS_CLASS, 'summary');

  goog.object.forEach(xcov.coverage.Status, function(status) {
    /** @const */ var count = this.sources_.getTotalLineCount(status);

    if (status === xcov.coverage.Status.NO_CODE || count === 0) {
      // Display only relevant lines of code
      return null;
    }

    // NOTE: We do not use the percent value in the condition above to avoid
    // triggering a division-by-zero assertion. This case should not happen
    // unless some bug gets its way until here. In this very case, this code
    // won't raise an error (given that if the line count for this status is
    // equal to 0, then the total number of lines should be 0).

    /** @const */ var percent =
        this.sources_.getTotalLinePercentage(status);

    if (percent !== 0) {
      /** @const */ var cell = dom.createDom(goog.dom.TagName.TD, {
        'class': xcov.getCssName(style, status.style),
        'width': goog.string.buildString(percent, '%'),
        'data-tooltip': goog.string.buildString(percent, '% ', status.image)
      });

      dom.appendChild(row, cell);
    }
  }, this /* opt_obj */);

  return dom.createDom(goog.dom.TagName.TABLE, style,
      dom.createDom(goog.dom.TagName.TBODY, null, row));
};
