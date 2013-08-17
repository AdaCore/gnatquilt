/**
 * @fileoverview Visual progress bar for the report.
 */


goog.provide('xcov.ui.progress');

goog.require('goog.Timer');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.fx.easing');
goog.require('goog.style');
goog.require('goog.ui.Component');

goog.require('xcov.style');


/*************************
 * xcov.ui.progress.bar_ *
 *************************/


/**
 * @type {xcov.ui.progress.Bar_} The progress bar widget.
 * @private
 */
xcov.ui.progress.bar_ = null;


/*******************************
 * xcov.ui.progress.initialize *
 *******************************/


/**
 * Renders the progress bar in the current document.
 *
 * @param {goog.dom.DomHelper} domHelper DOM helper.
 */
xcov.ui.progress.initialize = function(domHelper) {
  if (!goog.isNull(xcov.ui.progress.bar_)) {
    xcov.ui.progress.finalize();
  }

  xcov.ui.progress.bar_ = new xcov.ui.progress.Bar_(domHelper);
  xcov.ui.progress.bar_.render();
};


/*****************************
 * xcov.ui.progress.finalize *
 *****************************/


/**
 * Destroys the current progress bar.
 */
xcov.ui.progress.finalize = function() {
  xcov.ui.progress.bar_.exitDocument();

  if (xcov.ui.progress.bar_.getElement()) {
    goog.dom.removeNode(xcov.ui.progress.bar_.getElement());
  }

  goog.dispose(xcov.ui.progress.bar_);
};


/************************
 * xcov.ui.progress.set *
 ************************/


/**
 * Sets the progression to be displayed by the progress bar.
 *
 * @param {number} percent Progression to display, in percentage.
 */
xcov.ui.progress.set = function(percent) {
  // Normalize the input value.

  if (percent < 0) {
    percent = 0;
  } else if (percent > 100) {
    percent = 100;
  }

  xcov.ui.progress.bar_.setProgress(percent);
};


/*************************
 * xcov.ui.progress.Bar_ *
 *************************/



/**
 * The progress bar widget.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 * @private
 */
xcov.ui.progress.Bar_ = function(opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {number} Cunnet progress to display, in percentage.
   * @private
   */
  this.progress_ = 0;
};
goog.inherits(xcov.ui.progress.Bar_, goog.ui.Component);


/***********************************
 * xcov.ui.progress.Bar_.CSS_CLASS *
 ***********************************/


/**
 * @type {string} Default CSS name for this widget.
 */
xcov.ui.progress.Bar_.CSS_CLASS =
    goog.getCssName(xcov.style.CSS_CLASS, 'progress');


/*****************************************
 * xcov.ui.progress.Bar_.animationTimer_ *
 *****************************************/


/**
 * @type {?number} Handle to the notification timer ID.
 * @private
 */
xcov.ui.progress.Bar_.prototype.animationTimer_ = null;


/***********************************
 * xcov.ui.progress.Bar_.createDom *
 ***********************************/


/** @inheritDoc */
xcov.ui.progress.Bar_.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style = xcov.ui.progress.Bar_.CSS_CLASS;

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV, style,
          dom.createDom(goog.dom.TagName.DIV,
              goog.getCssName(style, 'handle'))));

  this.updateProgress_();
};


/*************************************
 * xcov.ui.progress.Bar_.setProgress *
 *************************************/


/**
 * Sets the progression to be displayed by the progress bar.
 *
 * @param {number} percent Progression to display, in percentage.
 */
xcov.ui.progress.Bar_.prototype.setProgress = function(percent) {
  this.progress_ = percent;

  if (this.isInDocument()) {
    this.updateProgress_();
  }
};


/*********************************************
 * xcov.ui.progress.Bar_.animationTimerTick_ *
 *********************************************/


/**
 * Hides the progress bar.
 *
 * @private
 */
xcov.ui.progress.Bar_.prototype.animationTimerTick_ = function() {
  /** @const */ var element = this.getElement();

  var animation =
      new goog.fx.dom.FadeOutAndHide(element, 1000, goog.fx.easing.easeIn);

  this.getHandler().listenOnce(animation, goog.fx.Animation.EventType.END,
      function() {
        goog.dispose(animation);
        animation = null;
      });

  animation.play();

  goog.asserts.assert(goog.isDefAndNotNull(this.animationTimer_),
      'Unexpected null timer');

  goog.Timer.clear(this.animationTimer_);
  this.animationTimer_ = null;
};


/*****************************************
 * xcov.ui.progress.Bar_.updateProgress_ *
 *****************************************/


/**
 * Modifies the underlying elements to update the progress bar. Expects the
 * element to be rendered.
 *
 * @private
 */
xcov.ui.progress.Bar_.prototype.updateProgress_ = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var percent = this.progress_;
  /** @const */ var element = this.getElement();
  /** @const */ var handle = dom.getFirstElementChild(element);

  goog.asserts.assert(goog.isDefAndNotNull(handle), 'ProgressBar not rendered');

  goog.style.setStyle(handle, 'width', percent.toString() + '%');
  goog.style.showElement(element, percent > 0);

  if (percent === 100) {
    this.animationTimer_ = goog.Timer.callOnce(
        this.animationTimerTick_, 2000, this /* opt_handler */);
  }
};
