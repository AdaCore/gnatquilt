/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.SourceFileTableHelp');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/*******************************
 * xcov.ui.SourceFileTableHelp *
 *******************************/



/**
 * The help and legend text.
 *
 * @param {boolean} withExempted Whether to display the exemption-related
 *    columns or not.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFileTableHelp = function(withExempted, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {boolean}
   * @const
   * @private
   */
  this.withExempted_ = withExempted;
};
goog.inherits(xcov.ui.SourceFileTableHelp, goog.ui.Component);


/*****************************************
 * xcov.ui.SourceFileTableHelp.createDom *
 *****************************************/


/** @inheritDoc */
xcov.ui.SourceFileTableHelp.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var paragraph1 = dom.createDom(goog.dom.TagName.P, null,
      'The results (total and per file) contain:');

  /** @const */ var list1 = dom.createDom(goog.dom.TagName.UL, null,
      dom.createDom(goog.dom.TagName.LI, null,
          'the total number of lines "of relevance" for the unit ' +
          '(definition below);'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the number of such lines that are considered as fully, ' +
          'partially, or not covered for the chosen coverage ' +
          'criteria;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the number of such lines that are part of an exemption ' +
          'region, with or without actually exempted violations;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the number of such lines that are not coverable because no' +
          'machine code is generated (if requested by --non-coverable);'),
      dom.createDom(goog.dom.TagName.LI, null,
          'a visual summary of this coverage data.'));

  /** @const */ var paragraph2 = dom.createDom(goog.dom.TagName.P, null,
      dom.createDom(goog.dom.TagName.B, null, '"line of relevance"'),
      goog.string.buildString(' are the source lines that have ' +
          'associated object code and which include all or part of a ' +
          'source entity of interest if we are assessing a source ' +
          'level criterion.  Source comment lines are never included ' +
          'in the counts, typically. In the visual summaries, the ' +
          'colors have the following meaning:'));

  /** @const */ var style =
      goog.getCssName(xcov.style.CSS_CLASS, 'help');

  /** @const */ var legend = dom.createDom(goog.dom.TagName.TR);

  xcov.coverage.forEachStatus(function(status) {
    dom.appendChild(legend,
        dom.createDom(goog.dom.TagName.TD,
            xcov.getCssName(style, status.style), status.image));
  }, this /* opt_obj */, this.withExempted_);

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, style,
      paragraph1, list1, paragraph2,
      dom.createDom(goog.dom.TagName.TABLE,
          goog.getCssName(style, 'legend'),
          dom.createDom(goog.dom.TagName.TBODY, null, legend))));
};
