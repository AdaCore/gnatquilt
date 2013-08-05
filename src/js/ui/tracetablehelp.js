/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.TraceTableHelp');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/**************************
 * xcov.ui.TraceTableHelp *
 **************************/



/**
 * The help and legend text.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.TraceTableHelp = function(opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(xcov.ui.TraceTableHelp, goog.ui.Component);


/************************************
 * xcov.ui.TraceTableHelp.createDom *
 ************************************/


/** @inheritDoc */
xcov.ui.TraceTableHelp.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var paragraph1 = dom.createDom(goog.dom.TagName.P, null,
      'For each trace file, the following information is given:');

  /** @const */ var list1 = dom.createDom(goog.dom.TagName.UL, null,
      dom.createDom(goog.dom.TagName.LI, null,
          'the name of the trace file;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the name of the executable used to generate it;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'when it has been generated;'),
      dom.createDom(goog.dom.TagName.LI, null,
          'the tag that has been associated with this run, if any.'));

  /** @const */ var style =
      goog.getCssName(xcov.style.CSS_CLASS, 'help');

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, style,
      paragraph1, list1));
};

