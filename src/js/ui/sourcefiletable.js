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

goog.require('xcov.CoverageStatus');
goog.require('xcov.SourceFile');
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

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE, tableStyle,
      dom.createDom(goog.dom.TagName.THEAD, null,
          dom.createDom(goog.dom.TagName.TH, null, 'Source Filename'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Total lines'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Covered'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Partially Covered'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Not Covered'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Exempted, No Violation'),
          dom.createDom(goog.dom.TagName.TH, countCellStyle,
              'Exempted, Violations'),
          dom.createDom(goog.dom.TagName.TH, null, 'Summary')));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  goog.array.forEach(this.sources_, function(source) {
    /** @const */ var total = source.getLineCount();

    /**
     * Returns a string representation of the total lines of interest in this
     * file, filtered by coverage status.
     *
     * @param {xcov.CoverageStatus} coverageStatus Coverage status for
     *    filtering.
     * @return {string} The string representation of the total number of lines
     *    in this source file, given the input rules.
     * @private
     */
    function compute_(coverageStatus) {
      /** @const */ var count = source.getLineCount(coverageStatus);
      /** @const */ var percent = Math.ceil(count * 100 / total);

      return goog.string.buildString(count, ' (', percent, '%)');
    };

    /** @const */ var row = dom.createDom(goog.dom.TagName.TR, null,
        dom.createDom(goog.dom.TagName.TD, null, source.getFilename()),
        dom.createDom(goog.dom.TagName.TD, countCellStyle, total.toString()),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            compute_(xcov.CoverageStatus.COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            compute_(xcov.CoverageStatus.PARTIALLY_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            compute_(xcov.CoverageStatus.NOT_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            compute_(xcov.CoverageStatus.EXEMPTED_NO_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            compute_(xcov.CoverageStatus.EXEMPTED_WITH_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, null, '<null>'));

    dom.appendChild(tableBody, row);
  });

  dom.appendChild(table, tableBody);
  this.setElementInternal(table);
};
