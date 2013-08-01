/**
 * @fileoverview Provides a dynamic table to list the sources extracted from the
 *    report.
 */


goog.provide('xcov.ui.SourceFileTable');

goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.SourceFile');
goog.require('xcov.coverage');
goog.require('xcov.style');


/***************************
 * xcov.ui.SourceFileTable *
 ***************************/



/**
 * A source table displaying the list of sources and providing high-level
 * functionalities such as column sorting.
 *
 * @param {Array.<!xcov.SourceFile>} sources List of sources from the coverage
 *    report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFileTable = function(sources, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.SourceFileTable');

  /**
   * @type {Array.<!xcov.SourceFile>}
   * @const
   * @private
   */
  this.sources_ = sources;
};
goog.inherits(xcov.ui.SourceFileTable, goog.ui.Component);


/*************************************
 * xcov.ui.SourceFileTable.createDom *
 *************************************/


/** @inheritDoc */
xcov.ui.SourceFileTable.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style = goog.getCssName(xcov.style.CSS_CLASS, 'sources');
  /** @const */ var tableStyle = goog.getCssName(style, 'table');
  /** @const */ var countCellStyle = goog.getCssName(tableStyle, 'count');
  /** @const */ var summaryCellStyle = goog.getCssName(tableStyle, 'summary');

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE, tableStyle,
      dom.createDom(goog.dom.TagName.THEAD, null,
          dom.createDom(goog.dom.TagName.TH, null, 'Source Filename'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Total lines'),
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
          dom.createDom(goog.dom.TagName.TH, null, 'Summary')));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  goog.array.forEach(this.sources_, function(source, index) {
    /**
     * Returns a string representation of the total lines of interest in this
     * file, filtered by coverage status.
     *
     * @param {xcov.coverage.Status} coverageStatus Coverage status for
     *    filtering.
     * @return {string} The string representation of the total number of lines
     *    in this source file, given the input rules.
     * @private
     */
    function cellTextContent_(coverageStatus) {
      /** @const */ var count = source.getLineCount(coverageStatus);
      /** @const */ var percent = source.getLinePercentage(coverageStatus);

      return goog.string.buildString(count, ' (', percent, '%)');
    };

    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    /** @const */ var row = dom.createDom(goog.dom.TagName.TR, rowStyle,
        dom.createDom(goog.dom.TagName.TD, null, source.getFilename()),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            source.getLineCount().toString() + ' lines'),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellTextContent_(xcov.coverage.Status.COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellTextContent_(xcov.coverage.Status.PARTIALLY_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellTextContent_(xcov.coverage.Status.NOT_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellTextContent_(xcov.coverage.Status.EXEMPTED_NO_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellTextContent_(xcov.coverage.Status.EXEMPTED_WITH_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, summaryCellStyle,
            xcov.ui.SourceFileTable.createCoverageSummaryDom_(source, dom)));

    dom.appendChild(tableBody, row);
  });

  dom.appendChild(table, tableBody);
  this.setElementInternal(table);
};


/*****************************************************
 * xcov.ui.SourceFileTable.createCoverageSummaryDom_ *
 *****************************************************/


/**
 * Creates and returns a DOM element that visually represent the coverage level
 * for the given source.
 *
 * @param {!xcov.SourceFile} source The source file with coverage information.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @return {?Element} The DOM element.
 * @private
 */
xcov.ui.SourceFileTable.createCoverageSummaryDom_ = function(source, dom) {
  /** @const */ var row = dom.createDom(goog.dom.TagName.TR, null);

  goog.object.forEach(xcov.coverage.Status, function(status) {
    /** @const */ var count = source.getLineCount(status);

    if (status === xcov.coverage.Status.NO_CODE || count === 0) {
      // Display only relevant lines of code
      return null;
    }

    // NOTE: We do not use the percent value in the condition above to avoid
    // triggering a division-by-zero assertion. This case should not happen
    // unless some bug gets its way until here. In this very case, this code
    // won't raise an error (given that if the line count for this status is
    // equal to 0, then the total number of lines should be 0).

    /** @const */ var percent = source.getLinePercentage(status);

    if (percent !== 0) {
      /** @const */ var cell = dom.createDom(goog.dom.TagName.TD, {
        'class': status.style,
        'width': goog.string.buildString(percent, '%'),
        'title': goog.string.buildString(percent, '% ', status.image)
      });

      dom.appendChild(row, cell);
    }
  });

  return dom.createDom(goog.dom.TagName.TABLE,
      goog.getCssName(xcov.style.CSS_CLASS, 'coverage-summary'),
      dom.createDom(goog.dom.TagName.TBODY, null, row));
};
