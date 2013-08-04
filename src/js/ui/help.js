/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.Help');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/****************
 * xcov.ui.Help *
 ****************/



/**
 * The help and legend text.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.Help = function(opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(xcov.ui.Help, goog.ui.Component);


/**************************
 * xcov.ui.Help.createDom *
 **************************/


/** @inheritDoc */
xcov.ui.Help.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var paragraph1 = dom.createDom(goog.dom.TagName.P, null,
      'This report presents a global view of the coverage results for' +
      'the given coverage level. It sums up:');

  /** @const */ var list1 = dom.createDom(goog.dom.TagName.UL, null,
      dom.createDom(goog.dom.TagName.LI, null,
          'the list of trace files processed by gnatcov;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the global coverage results;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the coverage results per source file.'));

  /** @const */ var paragraph2 = dom.createDom(goog.dom.TagName.P, null,
      'For each trace file, the following information is given:');

  /** @const */ var list2 = dom.createDom(goog.dom.TagName.UL, null,
      dom.createDom(goog.dom.TagName.LI, null,
          'the name of the trace file;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the name of the executable used to generate it;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'when it has been generated;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the tag that has been associated with this run, if any.'));

  /** @const */ var paragraph3 = dom.createDom(goog.dom.TagName.P, null,
      'The results (total and per file) contain:');

  /** @const */ var list3 = dom.createDom(goog.dom.TagName.UL, null,
      dom.createDom(goog.dom.TagName.LI, null,
          'the total number of lines "of relevance" for the unit ' +
          '(definition below);'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the number of such lines that are considered as fully, ' +
          'partially, or not covered for the chosen coverage ' +
          'criteria;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the number of such lines that are part of an exemption ' +
          'region, with or without actually exempted violations'),
      dom.createDom(goog.dom.TagName.LI, null,
          'a visual summary of this coverage data.'));

  /** @const */ var paragraph4 = dom.createDom(goog.dom.TagName.P, null,
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

  goog.object.forEach(xcov.coverage.Status, function(status) {
    if (status === xcov.coverage.Status.NO_CODE) {
      return;
    }

    dom.appendChild(legend,
        dom.createDom(goog.dom.TagName.TD,
            xcov.getCssName(style, status.style), status.image));
  });

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, style,
      paragraph1, list1, paragraph2, list2, paragraph3, list3,
      paragraph4, dom.createDom(goog.dom.TagName.TABLE,
          goog.getCssName(style, 'legend'),
          dom.createDom(goog.dom.TagName.TBODY, null, legend))));
};
