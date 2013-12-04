/**
 * @fileoverview A simple title element.
 */


goog.provide('xcov.ui.SectionTitle');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/************************
 * xcov.ui.SectionTitle *
 ************************/



/**
 * A simple title.
 *
 * @param {string} label The title label.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SectionTitle = function(label, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {string}
   * @const
   * @private
   */
  this.label_ = label;
};
goog.inherits(xcov.ui.SectionTitle, goog.ui.Component);


/**********************************
 * xcov.ui.SectionTitle.createDom *
 **********************************/


/** @inheritDoc */
xcov.ui.SectionTitle.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.H2,
          goog.getCssName(xcov.style.CSS_CLASS, 'section-title'),
          dom.htmlToDocumentFragment('&#10095; ' + this.label_)));
};
