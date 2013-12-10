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
goog.require('xcov.ui.TableUtils');


/***************************
 * xcov.ui.SourceFileTable *
 ***************************/



/**
 * A source table displaying the list of sources and providing high-level
 * functionalities such as column sorting.
 *
 * @param {!xcov.SourceSet} sources List of sources from the coverage report.
 * @param {boolean} withExempted Whether to display the exemption-related
 *    columns or not.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFileTable = function(sources, withExempted, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.SourceSet}
   * @const
   * @private
   */
  this.sources_ = sources;

  /**
   * @type {boolean}
   * @const
   * @private
   */
  this.withExempted_ = withExempted;

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

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE,
      xcov.ui.TableUtils.CSS_CLASS,
      xcov.ui.TableUtils.createTableHead('Sources', dom, this.withExempted_));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  this.sources_.forEach(function(source, index) {
    /** @const */ var sourceLinkDom = dom.createDom(goog.dom.TagName.A, {
      'href': xcov.navigation.getCanonicalSourceFileURL(source.getFilename())
    }, dom.createDom(goog.dom.TagName.SPAN, null, source.getFilename()));

    /** @const */ var row =
        xcov.ui.TableUtils.createTableRow(sourceLinkDom, source, dom,
            this.withExempted_, index);

    dom.appendChild(tableBody, row);
    goog.object.set(this.rows_, source.getFilename(), row);
  }, this /* opt_obj */);

  dom.appendChild(table, tableBody);
  this.setElementInternal(table);
};


/************************************
 * xcov.ui.SourceFile.enterDocument *
 ************************************/


/** @inheritDoc */
xcov.ui.SourceFileTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.enableAccessibilityNavigation_();

  // The following code is related to the sorting capabilities. We want to avoid
  // this when not needed, ie. when we have zero or one line.

  if (goog.object.getCount(this.rows_) < 2) {
    return;
  }

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

  /** @const */ var EXEMPTIONS = [
    xcov.coverage.Status.EXEMPTED_NO_VIOLATION,
    xcov.coverage.Status.EXEMPTED_WITH_VIOLATION
  ];

  goog.object.forEach(xcov.coverage.Status, function(value) {
    if (value === xcov.coverage.Status.NO_CODE) {
      return;
    }

    if (goog.array.contains(EXEMPTIONS, value) && !this.withExempted_) {
      return;
    }

    this.getHandler().listen(elt, goog.events.EventType.CLICK,
        goog.bind(this.onSort_, this,
            goog.partial(xcov.sort.compareCoverageStatusPercentage, value)));

    elt = dom.getNextElementSibling(elt);
  }, this /* opt_obj */);

  this.getHandler().listen(summaryTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareCoveragePercentage));
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
 * @param {goog.events.Event} e Event object.
 * @private
 */
xcov.ui.SourceFileTable.prototype.onSort_ = function(compareFn, e) {
  goog.asserts.assert(!goog.isNull(this.getElement()),
      'Table need to be rendered first');
  goog.asserts.assert(!goog.isNull(this.rows_), 'Missing internal structures');

  this.sources_.sort(compareFn);

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var thead = dom.getFirstElementChild(this.getElement());
  /** @const */ var tbody = dom.getLastElementChild(this.getElement());

  dom.removeChildren(tbody);

  this.sources_.forEach(function(file, index) {
    /** @const */ var row =
        goog.object.get(this.rows_, file.getFilename(), null /* opt_val */);

    goog.asserts.assert(goog.isDefAndNotNull(row), 'Unexpected null row');

    xcov.ui.TableUtils.setRowStyle(row, index);
    dom.appendChild(tbody, row);
  }, this /* opt_obj */);

  xcov.ui.TableUtils.showSortArrow(thead,
      /** @type {Element} */ (e.target), dom);
};
