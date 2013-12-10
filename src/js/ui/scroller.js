/**
 * @fileoverview An visual button to scroll back to the top of the page.
 */


goog.provide('xcov.ui.Scroller');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');

goog.require('xcov.style');
goog.require('xcov.ui.Tooltip');


/********************
 * xcov.ui.Scroller *
 ********************/



/**
 * An visual button to scroll back to the top of the page.
 *
 * @param {Element} container Scrollable element in which this widget is
 *    rendered.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.Scroller = function(container, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {Element}
   * @const
   * @private
   */
  this.container_ = container;
};
goog.inherits(xcov.ui.Scroller, goog.ui.Component);


/******************************
 * xcov.ui.Scroller.createDom *
 ******************************/


/** @inheritDoc */
xcov.ui.Scroller.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var elt = dom.createDom(
      goog.dom.TagName.DIV,
      goog.getCssName(xcov.style.CSS_CLASS, 'scroller'),
      dom.htmlToDocumentFragment('&#8679;'));

  xcov.ui.Tooltip.attach(elt, 'Scroll back to top');

  this.setElementInternal(elt);
};


/**********************************
 * xcov.ui.Scroller.enterDocument *
 **********************************/


/** @inheritDoc */
xcov.ui.Scroller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.getHandler().listen(this.container_, goog.events.EventType.SCROLL,
      this.handleScroll_);

  this.getHandler().listen(this.getElement(), goog.events.EventType.CLICK,
      this.handleClick_);

  this.handleScroll_();
};


/*********************************
 * xcov.ui.Scroller.exitDocument *
 *********************************/


/** @inheritDoc */
xcov.ui.Scroller.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
  this.getHandler().removeAll();
};


/**********************************
 * xcov.ui.Scroller.handleScroll_ *
 **********************************/


/**
 * Handles the SCROLL event.
 *
 * @private
 */
xcov.ui.Scroller.prototype.handleScroll_ = function() {
  /** @const */ var show = this.container_.scrollTop !== 0;

  goog.style.showElement(this.getElement(), show);
  xcov.ui.Tooltip.setEnabled(this.getElement(), show);
};


/*********************************
 * xcov.ui.Scroller.handleClick_ *
 *********************************/


/**
 * Handles the CLICK event.
 *
 * @private
 */
xcov.ui.Scroller.prototype.handleClick_ = function() {
  this.container_.scrollTop = 0;
  this.handleScroll_();
};
