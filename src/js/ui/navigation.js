/**
 * @fileoverview Navigation widget.
 */


goog.provide('xcov.ui.Navigation');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/**********************
 * xcov.ui.Navigation *
 **********************/



/**
 * Navigation widget.
 *
 * @param {string} label The link label.
 * @param {string} href The link target.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.Navigation = function(label, href, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {string}
   * @private
   */
  this.label_ = label;

  /**
   * @type {string}
   * @private
   */
  this.href_ = href;
};
goog.inherits(xcov.ui.Navigation, goog.ui.Component);


/********************************
 * xcov.ui.Navigation.createDom *
 ********************************/


/** @inheritDoc */
xcov.ui.Navigation.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV,
      goog.getCssName(xcov.style.CSS_CLASS, 'navigation'),
      dom.createDom(goog.dom.TagName.A,
          { 'href': this.href_ }, this.label_)));
};
