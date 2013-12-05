/**
 * @fileoverview List the various projects for the coverage analysis
 *    with associated coverage results.
 */


goog.provide('xcov.ui.ProjectTable');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.ProjectSet');
goog.require('xcov.coverage');
goog.require('xcov.navigation');
goog.require('xcov.style');
goog.require('xcov.ui.TableUtils');


/************************
 * xcov.ui.ProjectTable *
 ************************/



/**
 * A table that lists the projects from the report.
 *
 * @param {!xcov.ProjectSet} projects The project list from the report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.ProjectTable = function(projects, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.ProjectSet}
   * @const
   * @private
   */
  this.projects_ = projects;

  /**
   * @type {Object.<string,!Node>} Table rows stored for easy sorting. This
   *    table is populated in the {@code createDom} method. Keys are project
   *    names.
   * @const
   * @private
   */
  this.rows_ = {};
};
goog.inherits(xcov.ui.ProjectTable, goog.ui.Component);


/**********************************
 * xcov.ui.ProjectTable.createDom *
 **********************************/


/** @inheritDoc */
xcov.ui.ProjectTable.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE,
      xcov.ui.TableUtils.CSS_CLASS,
      xcov.ui.TableUtils.createTableHead('Projects', dom));

  /** @const */ var tableBody = dom.createDom(goog.dom.TagName.TBODY);

  var index = 0;

  this.projects_.forEach(function(project) {
    var projectLinkDom = null;

    if (goog.string.isEmpty(project.getName())) {
      projectLinkDom = dom.createDom(goog.dom.TagName.A, {
        'href': ''  // ??? xcov.navigation.getCanonicalProjectURL(project)
      }, dom.createDom(goog.dom.TagName.SPAN, null, 'Other sources'));

    } else {
      projectLinkDom = dom.createDom(goog.dom.TagName.A, {
        'href': ''  // ??? xcov.navigation.getCanonicalProjectURL(project)
      }, dom.createDom(goog.dom.TagName.SPAN, null, project.getName()));
    }

    /** @const */ var row =
        xcov.ui.TableUtils.createTableRow(projectLinkDom,
            project.getSources(), dom, index);

    dom.appendChild(tableBody, row);
    goog.object.set(this.rows_, project.getName(), row);

    index = index + 1;
  }, this /* opt_obj */);

  dom.appendChild(table, tableBody);
  this.setElementInternal(table);
};


/**************************************
 * xcov.ui.ProjectTable.enterDocument *
 **************************************/


/** @inheritDoc */
xcov.ui.ProjectTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var thead = dom.getFirstElementChild(this.getElement());
  /** @const */ var projectTitleCell = dom.getFirstElementChild(thead);
  /** @const */ var summaryTitleCell = dom.getLastElementChild(thead);

  /** @const */ var totalTitleCell =
      dom.getNextElementSibling(projectTitleCell);

  this.getHandler().listen(projectTitleCell, goog.events.EventType.CLICK,
      goog.bind(this.onSort_, this, xcov.sort.compareName));

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
      goog.bind(this.onSort_, this,
          xcov.sort.compareCoveragePercentage));

  this.enableAccessibilityNavigation_();
};


/*************************************
 * xcov.ui.ProjectTable.exitDocument *
 *************************************/


/** @inheritDoc */
xcov.ui.ProjectTable.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
  this.getHandler().removeAll();
};


/*******************************************************
 * xcov.ui.ProjectTable.enableAccessibilityNavigation_ *
 *******************************************************/


/**
 * Makes each row clickable to ease navigation.
 * This function is expected to be called from {@code #enterDocument}.
 *
 * @private
 */
xcov.ui.ProjectTable.prototype.enableAccessibilityNavigation_ = function() {
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


/********************************
 * xcov.ui.ProjectTable.onSort_ *
 ********************************/


/**
 * On click callback for table headers.
 *
 * @param {?function(!xcov.Project,!xcov.Project):number} compareFn
 *    Comparison function by which the array is to be ordered. Should take 2
 *    arguments to compare, and return a negative number, zero, or a positive
 *    number depending on whether the first argument is less than, equal to, or
 *    greater than the second.
 * @private
 */
xcov.ui.ProjectTable.prototype.onSort_ = function(compareFn) {
  goog.asserts.assert(!goog.isNull(this.getElement()),
      'Table need to be rendered first');
  goog.asserts.assert(!goog.isNull(this.rows_), 'Missing internal structures');

  this.projects_.sort(compareFn);

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var tbody = dom.getLastElementChild(this.getElement());

  dom.removeChildren(tbody);

  this.projects_.forEach(function(project, index) {
    /** @const */ var row =
        goog.object.get(this.rows_, project.getName(), null /* opt_val */);

    goog.asserts.assert(goog.isDefAndNotNull(row), 'Unexpected null row');

    xcov.ui.TableUtils.setRowStyle(row, index);
    dom.appendChild(tbody, row);
  }, this /* opt_obj */);
};
