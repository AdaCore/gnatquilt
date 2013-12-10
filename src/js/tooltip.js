/**
 * @fileoverview Implementation of a generic tooltip extending
 *    {@code goog.ui.HoverCard} which prevent having multiple instance of a
 *    tooltip widget.
 */


goog.provide('xcov.ui.Tooltip');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('goog.ui.HoverCard');

goog.require('xcov.positioning.TooltipPosition');
goog.require('xcov.style');


/*******************
 * xcov.ui.Tooltip *
 *******************/



/**
 * Implementation of the tooltip.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.HoverCard}
 */
xcov.ui.Tooltip = function(opt_domHelper) {
  goog.base(this, {
    'TD': 'data-tooltip',
    'TH': 'data-tooltip',
    'DIV': 'data-tooltip',
    'SPAN': 'data-tooltip',
    'BUTTON': 'data-tooltip'
  }, true /* opt_checkDescendants */, opt_domHelper /* opt_domHelper */);

  /**
   * @type {Element} Content element.
   * @private
   */
  this.contentElt_ = null;

  /**
   * @type {{top: Element, bottom: Element, left: Element, right: Element}}
   *    Arrow elements.
   * @private
   */
  this.arrows_ = {
    top: null,
    bottom: null,
    left: null,
    right: null
  };

  this.className = goog.getCssName(xcov.style.CSS_CLASS, 'tooltip');
  this.createDomInternal();
  this.setHotSpotPadding(new goog.math.Box(10, 10, 10, 10));

  this.setShowDelayMs(125);

  this.getHandler().listen(this, goog.ui.HoverCard.EventType.TRIGGER,
      this.onTriggerInternal);
  this.getHandler().listen(this, goog.ui.HoverCard.EventType.BEFORE_SHOW,
      this.onBeforeShowInternal);
};
goog.inherits(xcov.ui.Tooltip, goog.ui.HoverCard);


/****************************************
 * xcov.ui.Tooltip.tooltipEventHandler_ *
 ****************************************/


/**
 * @type {goog.events.EventHandler} Event handler.
 * @private
 */
xcov.ui.Tooltip.prototype.tooltipEventHandler_ = null;


/**********************************
 * xcov.ui.Tooltip.DEFAULT_MARGIN *
 **********************************/


/**
 * @define {number} Default margin for the tooltip popup.
 */
xcov.ui.Tooltip.DEFAULT_MARGIN = 5;


/****************************************
 * xcov.ui.Tooltip.DEFAULT_ARROW_OFFSET *
 ****************************************/


/**
 * @define {number} Default offset for the arrow position.
 */
xcov.ui.Tooltip.DEFAULT_ARROW_OFFSET = 10;


/******************************
 * xcov.ui.Tooltip.getHandler *
 ******************************/


/**
 * Returns the event handler for this component, lazily created the first time
 * this method is called.
 *
 * @return {!goog.events.EventHandler} Event handler for this component.
 * @protected
 */
xcov.ui.Tooltip.prototype.getHandler = function() {
  return this.tooltipEventHandler_ ||
      (this.tooltipEventHandler_ = new goog.events.EventHandler(this));
};


/***********************************
 * xcov.ui.Tooltip.disposeInternal *
 ***********************************/


/** @inheritDoc */
xcov.ui.Tooltip.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.getHandler().removeAll();
};


/**************************
 * xcov.ui.Tooltip.attach *
 **************************/


/**
 * Attaches the tooltip to the given element with the given message.
 *
 * @param {Element} element The element on which to attach the tooltip.
 * @param {string} message The tooltip message to display.
 * @param {xcov.ui.Tooltip.Position=} opt_position The position of the tooltip,
 *    relative to the target element.
 */
xcov.ui.Tooltip.attach = function(element, message, opt_position) {
  element.setAttribute('data-tooltip', message);
  element.setAttribute('data-tooltip-enable', 'true');

  if (opt_position) {
    element.setAttribute('data-tooltip-position', opt_position);
  }
};


/*******************************
 * xcov.ui.Tooltip.setPosition *
 *******************************/


/**
 * Sets the position of the tooltip for the given element.
 *
 * @param {Element} element The element on which to attach the tooltip.
 * @param {xcov.ui.Tooltip.Position=} opt_position The position of the tooltip,
 *    relative to the target element.
 */
xcov.ui.Tooltip.setPosition = function(element, opt_position) {
  element.setAttribute('data-tooltip-position', opt_position || '');
};


/******************************
 * xcov.ui.Tooltip.setEnabled *
 ******************************/


/**
 * Enables/disables the tooltip triggering.
 *
 * @param {Element} element The element on which to attach the tooltip.
 * @param {boolean} enable Whether to enable the tooltip or not.
 */
xcov.ui.Tooltip.setEnabled = function(element, enable) {
  element.setAttribute('data-tooltip-enable', enable.toString());
};


/***************************************
 * xcov.ui.Tooltip.createArrowInternal *
 ***************************************/


/**
 * Creates an arrow element.
 *
 * @param {string} cssName CSS name.
 * @return {Element} The arrow element.
 * @protected
 */
xcov.ui.Tooltip.prototype.createArrowInternal = function(cssName) {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var outerClass = goog.getCssName(cssName, 'outer');
  /** @const */ var innerClass = goog.getCssName(cssName, 'inner');

  return dom.createDom(goog.dom.TagName.DIV, cssName,
      dom.createDom(goog.dom.TagName.DIV, outerClass,
          dom.createDom(goog.dom.TagName.DIV, innerClass)));
};


/*************************************
 * xcov.ui.Tooltip.createDomInternal *
 *************************************/


/**
 * Creates the DOM element.
 *
 * @protected
 */
xcov.ui.Tooltip.prototype.createDomInternal = function() {
  /** @const */ var dom = this.getDomHelper();

  // Create the content element, which is holding the caption of the tooltip.
  this.contentElt_ = dom.createDom(goog.dom.TagName.DIV,
      goog.getCssName(this.className, 'content'));

  // Create all arrow elements that will be displayed or not depending on the
  // position of the popup.
  this.arrows_.bottom =
      this.createArrowInternal(goog.getCssName(this.className, 'bottom-arrow'));
  this.arrows_.left =
      this.createArrowInternal(goog.getCssName(this.className, 'left-arrow'));
  this.arrows_.right =
      this.createArrowInternal(goog.getCssName(this.className, 'right-arrow'));
  this.arrows_.top =
      this.createArrowInternal(goog.getCssName(this.className, 'top-arrow'));

  /** @const */ var innerEl = dom.createDom(goog.dom.TagName.DIV,
      goog.getCssName(this.className, 'inner'), this.contentElt_);

  /** @const */ var element = dom.createDom(goog.dom.TagName.DIV,
      this.className, innerEl, this.arrows_.bottom, this.arrows_.left,
      this.arrows_.right, this.arrows_.top);

  goog.style.showElement(element, false);
  goog.style.showElement(this.arrows_.bottom, false);
  goog.style.showElement(this.arrows_.left, false);
  goog.style.showElement(this.arrows_.right, false);
  goog.style.showElement(this.arrows_.top, false);

  this.setElement(element);
};


/*************************************
 * xcov.ui.Tooltip.getContentElement *
 *************************************/


/**
 * Returns the DOM element into which the caption is set.
 *
 * @return {?Element} The content element.
 */
xcov.ui.Tooltip.prototype.getContentElement = function() {
  return this.contentElt_;
};


/***************************
 * xcov.ui.Tooltip.setText *
 ***************************/


/**
 * Sets tooltip message as plain text.
 *
 * @param {string} str Text message to display in tooltip.
 * @override
 */
xcov.ui.Tooltip.prototype.setText = function(str) {
  goog.dom.setTextContent(this.getContentElement(), str);
};


/***************************
 * xcov.ui.Tooltip.setHtml *
 ***************************/


/**
 * Sets tooltip message as HTML markup.
 *
 * @param {string} str HTML message to display in tooltip.
 * @override
 */
xcov.ui.Tooltip.prototype.setHtml = function(str) {
  /** @const */ var element = this.getContentElement();
  /** @const */ var dom = goog.dom.getDomHelper(element);

  dom.removeChildren(element);
  dom.appendChild(element, goog.dom.htmlToDocumentFragment(str));
};


/***************************
 * xcov.ui.Tooltip.getText *
 ***************************/


/**
 * @return {string} The tooltip message as plain text.
 * @override
 */
xcov.ui.Tooltip.prototype.getText = function() {
  return goog.dom.getTextContent(this.getContentElement());
};


/***************************
 * xcov.ui.Tooltip.getHtml *
 ***************************/


/**
 * @return {string} The tooltip message as HTML.
 * @override
 */
xcov.ui.Tooltip.prototype.getHtml = function() {
  return goog.dom.getOuterHtml(this.getContentElement());
};


/*************************************
 * xcov.ui.Tooltip.onTriggerInternal *
 *************************************/


/**
 * Handler for TRIGGER event.
 *
 * @param {goog.events.Event} event Event object.
 * @return {boolean} Whether hovercard should be shown or cancelled.
 * @protected
 */
xcov.ui.Tooltip.prototype.onTriggerInternal = function(event) {
  /** @const */ var trigger = event.anchor;

  /** @const */ var message = trigger.getAttribute('data-tooltip');
  this.getContentElement().innerHTML = message;

  /** @const */ var position = trigger.getAttribute('data-tooltip-position') ||
      xcov.ui.Tooltip.Position.DEFAULT;
  this.setPosition(
      new xcov.positioning.TooltipPosition(trigger, this, position));

  return true;
};


/****************************************
 * xcov.ui.Tooltip.onBeforeShowInternal *
 ****************************************/


/**
 * Handler for BEFORE_SHOW event.
 *
 * @return {boolean} Whether hovercard should be shown or cancelled.
 * @protected
 */
xcov.ui.Tooltip.prototype.onBeforeShowInternal = function() {
  /** @const */ var enable = this.anchor.getAttribute('data-tooltip-enable');

  // Default to TRUE if TOOLTIP-ENABLE is not set

  if (goog.isDefAndNotNull(enable) && enable === 'false') {
    return false;
  }

  return true;
};


/*****************************
 * xcov.ui.Tooltip.showArrow *
 *****************************/


/**
 * Displays none, one or all arrows arround the tooltip.
 *
 * @param {xcov.ui.Tooltip.Arrow=} opt_arrow The arrow to display. Defaults to
 *    {@code xcov.ui.Tooltip.Arrow.NONE}.
 * @param {number=} opt_pos Optional position for the arrow (horizontal for top
 *    and bottom arrows, vertical for left and right).
 */
xcov.ui.Tooltip.prototype.showArrow = function(opt_arrow, opt_pos) {
  /** @const */ var arrow = opt_arrow || xcov.ui.Tooltip.Arrow.NONE;

  goog.style.showElement(this.arrows_.bottom,
      arrow === xcov.ui.Tooltip.Arrow.ALL ||
      arrow === xcov.ui.Tooltip.Arrow.BOTTOM);
  goog.style.showElement(this.arrows_.left,
      arrow === xcov.ui.Tooltip.Arrow.ALL ||
      arrow === xcov.ui.Tooltip.Arrow.LEFT);
  goog.style.showElement(this.arrows_.right,
      arrow === xcov.ui.Tooltip.Arrow.ALL ||
      arrow === xcov.ui.Tooltip.Arrow.RIGHT);
  goog.style.showElement(this.arrows_.top,
      arrow === xcov.ui.Tooltip.Arrow.ALL ||
      arrow === xcov.ui.Tooltip.Arrow.TOP);

  if (arrow !== xcov.ui.Tooltip.Arrow.ALL &&
      arrow !== xcov.ui.Tooltip.Arrow.NONE) {

    /** @const */ var pos = (opt_pos !== null && opt_pos) ||
        xcov.ui.Tooltip.DEFAULT_ARROW_OFFSET;

    this.setArrowPosition_(arrow, pos);
  }
};


/*************************************
 * xcov.ui.Tooltip.setArrowPosition_ *
 *************************************/


/**
 * Sets the position for the tooltip arrow.
 *
 * @param {xcov.ui.Tooltip.Arrow} arrow The arrow to display.
 * @param {number} pos Position for the arrow (horizontal for top
 *    and bottom arrows, vertical for left and right).
 * @private
 */
xcov.ui.Tooltip.prototype.setArrowPosition_ = function(arrow, pos) {
  goog.asserts.assert(arrow !== xcov.ui.Tooltip.Arrow.ALL &&
                      arrow !== xcov.ui.Tooltip.Arrow.NONE,
                      'unexpected arrow type');
  goog.asserts.assert(goog.isNumber(pos), 'invalid position');

  switch (arrow) {
    case xcov.ui.Tooltip.Arrow.BOTTOM:
      goog.style.setStyle(this.arrows_.bottom, 'left', pos + 'px');
      break;
    case xcov.ui.Tooltip.Arrow.LEFT:
      goog.style.setStyle(this.arrows_.left, 'top', pos + 'px');
      break;
    case xcov.ui.Tooltip.Arrow.RIGHT:
      goog.style.setStyle(this.arrows_.right, 'top', pos + 'px');
      break;
    case xcov.ui.Tooltip.Arrow.TOP:
      goog.style.setStyle(this.arrows_.top, 'left', pos + 'px');
      break;
    default:
      goog.asserts.fail('Internal error: invalid arrow');
      break;
  }
};


/****************************
 * xcov.ui.Tooltip.Position *
 ****************************/


/** @enum {string} */
xcov.ui.Tooltip.Position = {
  ABOVE: '+above',
  BELOW: '+below',
  DEFAULT: '+default',
  LEFT: '+left',
  RIGHT: '+right'
};


/*************************
 * xcov.ui.Tooltip.Arrow *
 *************************/


/** @enum {string} */
xcov.ui.Tooltip.Arrow = {
  ALL: '+all',
  NONE: '+none',
  BOTTOM: '+bottom',
  LEFT: '+left',
  RIGHT: '+right',
  TOP: '+top'
};
