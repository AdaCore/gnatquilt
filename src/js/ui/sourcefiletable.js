/**
 * @fileoverview Provides a dynamic table to list the sources extracted from the
 *    report.
 */


goog.provide('xcov.ui.SourceFileTable');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');

goog.require('xcov.SourceFile');
goog.require('xcov.SourceSet');
goog.require('xcov.coverage');
goog.require('xcov.navigation');
goog.require('xcov.sort');
goog.require('xcov.style');


/***************************
 * xcov.ui.SourceFileTable *
 ***************************/



/**
 * A source table displaying the list of sources and providing high-level
 * functionalities such as column sorting.
 *
 * @param {!xcov.SourceSet} sources List of sources from the coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFileTable = function(sources, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.SourceSet}
   * @const
   * @private
   */
  this.sources_ = sources;

  /**
   * @type {Object.<string,!Node>} Table rows stored for easy sorting. This
   *    table is populated in the {@code createDom} method. Keys are filenames.
   * @const
   * @private
   */
  this.rows_ = {};
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
  /** @const */ var cellStyle = goog.getCssName(tableStyle, 'cell');
  /** @const */ var countCellStyle = goog.getCssName(tableStyle, 'count');
  /** @const */ var summaryCellStyle = goog.getCssName(tableStyle, 'summary');
  /** @const */ var filenameCellStyle = goog.getCssName(tableStyle, 'filename');

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE, tableStyle,
      dom.createDom(goog.dom.TagName.THEAD, null,
          dom.createDom(goog.dom.TagName.TH, null, 'Source Filename'),
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
          dom.createDom(goog.dom.TagName.TH, null, 'Summary')));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  this.sources_.forEach(function(source, index) {
    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    /** @const */ var sourceLinkDom = dom.createDom(goog.dom.TagName.A, {
      'href': xcov.navigation.getCanonicalSourceFileURL(source.getFilename())
    }, dom.createDom(goog.dom.TagName.SPAN, null, source.getFilename()));

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
    function cellDomContent_(coverageStatus) {
      /** @const */ var count = source.getLineCount(coverageStatus);
      /** @const */ var percent = source.getLinePercentage(coverageStatus);

      return dom.createDom(goog.dom.TagName.DIV, cellStyle,
          dom.createDom(goog.dom.TagName.SPAN, null, count.toString()),
          dom.createDom(goog.dom.TagName.SPAN, null,
              (percent || 0).toString() + '%'));
    }

    /** @const */ var row = dom.createDom(goog.dom.TagName.TR, rowStyle,
        dom.createDom(goog.dom.TagName.TD, filenameCellStyle, sourceLinkDom),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            source.getLineCount().toString()),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellDomContent_(xcov.coverage.Status.COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellDomContent_(xcov.coverage.Status.PARTIALLY_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellDomContent_(xcov.coverage.Status.NOT_COVERED)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellDomContent_(xcov.coverage.Status.EXEMPTED_NO_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, countCellStyle,
            cellDomContent_(xcov.coverage.Status.EXEMPTED_WITH_VIOLATION)),
        dom.createDom(goog.dom.TagName.TD, summaryCellStyle,
            xcov.ui.SourceFileTable.createCoverageSummaryDom_(source, dom)));

    dom.appendChild(tableBody, row);
    goog.object.set(this.rows_, source.getFilename(), row);
  }, this /* opt_obj */);

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
  /** @const */ var style = goog.getCssName(xcov.style.CSS_CLASS, 'summary');

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


/************************************
 * xcov.ui.SourceFile.enterDocument *
 ************************************/


/** @inheritDoc */
xcov.ui.SourceFileTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var thead = dom.getFirstElementChild(this.getElement());
  /** @const */ var filenameTitleCell = dom.getFirstElementChild(thead);
  /** @const */ var summaryTitleCell = dom.getLastElementChild(thead);

  /** @const */ var totalTitleCell =
      dom.getNextElementSibling(filenameTitleCell);

  this.getHandler().listen(filenameTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareFileNames));

  this.getHandler().listen(totalTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareLineCount));

  /** @type {Element} */ var elt = dom.getNextElementSibling(totalTitleCell);

  goog.object.forEach(xcov.coverage.Status, function(value) {
    if (value === xcov.coverage.Status.NO_CODE) {
      return;
    }

    this.getHandler().listen(elt, goog.events.EventType.CLICK,
        goog.bind(this.onSort_, this,
            goog.partial(xcov.sort.compareCoverageStatusPercentage, value)));

    elt = dom.getNextElementSibling(elt);
  }, this /* opt_obj */);

  this.getHandler().listen(summaryTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareCoveragePercentage));

  this.enableAccessibilityNavigation_();
};


/****************************************
 * xcov.ui.SourceFileTable.exitDocument *
 ****************************************/


/** @inheritDoc */
xcov.ui.SourceFileTable.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
  this.getHandler().removeAll();
};


/**********************************************************
 * xcov.ui.SourceFileTable.enableAccessibilityNavigation_ *
 **********************************************************/


/**
 * Makes each row clickable to ease navigation.
 * This function is expected to be called from {@code #enterDocument}.
 *
 * @private
 */
xcov.ui.SourceFileTable.prototype.enableAccessibilityNavigation_ = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var tbody = dom.getLastElementChild(this.getElement());

  goog.array.forEach(dom.getChildren(tbody), function(row) {
    this.getHandler().listen(row, goog.events.EventType.CLICK,
        function() {
          /** @const */ var a =
              dom.getFirstElementChild(dom.getFirstElementChild(row));

          goog.asserts.assert('href' in a, 'Unexpected DOM element');
          dom.getWindow().location = a['href'];
        });
  }, this /* opt_obj */);
};


/***********************************
 * xcov.ui.SourceFileTable.onSort_ *
 ***********************************/


/**
 * On click callback for table headers.
 *
 * @param {?function(!xcov.SourceFile,!xcov.SourceFile):number} compareFn
 *    Comparison function by which the array is to be ordered. Should take 2
 *    arguments to compare, and return a negative number, zero, or a positive
 *    number depending on whether the first argument is less than, equal to, or
 *    greater than the second.
 * @private
 */
xcov.ui.SourceFileTable.prototype.onSort_ = function(compareFn) {
  goog.asserts.assert(!goog.isNull(this.getElement()),
      'Table need to be rendered first');
  goog.asserts.assert(!goog.isNull(this.rows_), 'Missing internal structures');

  this.sources_.sort(compareFn);

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var tbody = dom.getLastElementChild(this.getElement());

  dom.removeChildren(tbody);

  this.sources_.forEach(function(file, index) {
    /** @const */ var row =
        goog.object.get(this.rows_, file.getFilename(), null /* opt_val */);

    goog.asserts.assert(goog.isDefAndNotNull(row), 'Unexpected null row');

    /** @const */ var rowStyle = index % 2 === 0 ?
        xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

    goog.dom.classes.remove(row, xcov.style.ROW_EVEN_CSS_CLASS);
    goog.dom.classes.remove(row, xcov.style.ROW_ODD_CSS_CLASS);

    goog.dom.classes.add(row, rowStyle);

    dom.appendChild(tbody, row);
  }, this /* opt_obj */);
};
