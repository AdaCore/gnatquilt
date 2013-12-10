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
goog.require('xcov.ui.TableUtils');


/**********************
 * xcov.ui.TotalTable *
 **********************/



/**
 * A table displaying the total for each metrics.
 *
 * @param {!xcov.SourceSet} sources List of sources from the coverage
 *    report.
 * @param {boolean} withExempted Whether to display the exemption-related
 *    columns or not.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TotalTable = function(sources, withExempted, opt_domHelper) {
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
};
goog.inherits(xcov.ui.TotalTable, goog.ui.Component);


/********************************
 * xcov.ui.TotalTable.createDom *
 ********************************/


/** @inheritDoc */
xcov.ui.TotalTable.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  goog.asserts.assert(goog.isDefAndNotNull(this.sources_), 'compiler check');

  /** @const */ var table = dom.createDom(goog.dom.TagName.TABLE,
      xcov.ui.TableUtils.CSS_CLASS,
      xcov.ui.TableUtils.createTableHead(
          null /* title */, dom, this.withExempted_),
      dom.createDom(goog.dom.TagName.TBODY, null,
          xcov.ui.TableUtils.createTableRow(
              'Total', this.sources_, dom, this.withExempted_)));

  this.setElementInternal(table);
};
