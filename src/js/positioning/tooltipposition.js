/**
 * @fileoverview Anchored viewport positioning class for the widget
 *     {@code xcov.ui.Tooltip}.
 */


goog.provide('xcov.positioning.TooltipPosition');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.positioning');
goog.require('goog.positioning.AbstractPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.positioning.Overflow');
goog.require('goog.positioning.OverflowStatus');
goog.require('goog.style');


/************************************
 * xcov.positioning.TooltipPosition *
 ************************************/



/**
 * Encapsulates a popup position where the popup is anchored on one side of an
 * element.
 *
 * When using {@code xcov.positioning.TooltipPosition}, it is recommended that
 * the popup element specified in the Popup constructor or Popup.setElement be
 * absolutely positioned.
 *
 * @param {Element} anchor Element the movable element should be anchored
 *    against.
 * @param {xcov.ui.Tooltip} tooltip The tooltip widget to apply the correct
 *    style depending on the position chosen.
 * @param {xcov.ui.Tooltip.Position=} opt_position Position where to set the
 *    tooltip element. Defaults to {@code xcov.ui.Tooltip.Position.DEFAULT}.
 * @constructor
 * @extends {goog.positioning.AbstractPosition}
 */
xcov.positioning.TooltipPosition = function(anchor, tooltip, opt_position) {
  goog.base(this);

  /**
   * @type {Element} Element the movable element should be anchored against.
   * @private
   */
  this.anchor_ = anchor;

  /**
   * @type {xcov.ui.Tooltip} The tooltip widget.
   * @private
   */
  this.tooltip_ = tooltip;

  /**
   * @type {xcov.ui.Tooltip.Position} Side on where to display the tooltip for
   *    the given anchor. Defaults to {@code xcov.ui.Tooltip.Position.DEFAULT}.
   * @private
   */
  this.position_ = opt_position || xcov.ui.Tooltip.Position.DEFAULT;
};
goog.inherits(xcov.positioning.TooltipPosition,
              goog.positioning.AbstractPosition);


/**********************************************************
 * xcov.positioning.TooltipPosition.getPreferredPosition_ *
 **********************************************************/


/**
 * Computes the preferred position for the movableElement given the anchor
 * bounds and the position requested.
 *
 * @param {goog.math.Rect} anchorBounds Bounds for the anchor element.
 * @param {goog.math.Size} anchorSize Size for the anchor element.
 * @param {goog.math.Size} elementSize Size for the movable element.
 * @return {goog.math.Coordinate} The preferred position.
 * @private
 */
xcov.positioning.TooltipPosition.prototype.getPreferredPosition_ = function(
    anchorBounds, anchorSize, elementSize) {

  var coordinate = null;

  var hMiddle = Math.ceil(anchorBounds.left + (anchorSize.width / 2) -
      (elementSize.width / 2));
  var vMiddle = Math.ceil(anchorBounds.top + (anchorSize.height / 2) -
      (elementSize.height / 2));

  switch (this.position_) {
    case xcov.ui.Tooltip.Position.ABOVE:
      coordinate = new goog.math.Coordinate(
          hMiddle                            /* opt_x */,
          anchorBounds.top - elementSize.height -
          (xcov.ui.Tooltip.DEFAULT_MARGIN * 2) /* opt_y */);
      break;

    case xcov.ui.Tooltip.Position.BELOW:
    case xcov.ui.Tooltip.Position.DEFAULT:
      coordinate = new goog.math.Coordinate(
          hMiddle                              /* opt_x */,
          anchorBounds.top + anchorSize.height /* opt_y */);
      break;

    case xcov.ui.Tooltip.Position.LEFT:
      coordinate = new goog.math.Coordinate(
          anchorBounds.left - elementSize.width -
          (xcov.ui.Tooltip.DEFAULT_MARGIN * 2)  /* opt_x */,
          vMiddle                             /* opt_y */);
      break;

    case xcov.ui.Tooltip.Position.RIGHT:
      coordinate = new goog.math.Coordinate(
          anchorBounds.left + anchorSize.width /* opt_x */,
          vMiddle                              /* opt_y */);
      break;
    default:
      goog.asserts.fail('Internal error: Unrecognized position');
      break;
  }

  goog.asserts.assert(coordinate !== null, 'coordinate badly initialized');
  return coordinate;
};


/******************************************************
 * xcov.positioning.TooltipPosition.setArrowPosition_ *
 ******************************************************/


/**
 * Sets the arrow on one edge of the tooltip.
 *
 * @param {number} pos Arrow left or top value position.
 * @private
 */
xcov.positioning.TooltipPosition.prototype.setArrowPosition_ = function(pos) {
  /** @type {?xcov.ui.Tooltip.Arrow} */ var arrow = null;

  switch (this.position_) {
    case xcov.ui.Tooltip.Position.ABOVE:
      arrow = xcov.ui.Tooltip.Arrow.BOTTOM;
      break;
    case xcov.ui.Tooltip.Position.BELOW:
    case xcov.ui.Tooltip.Position.DEFAULT:
      arrow = xcov.ui.Tooltip.Arrow.TOP;
      break;
    case xcov.ui.Tooltip.Position.LEFT:
      arrow = xcov.ui.Tooltip.Arrow.RIGHT;
      break;
    case xcov.ui.Tooltip.Position.RIGHT:
      arrow = xcov.ui.Tooltip.Arrow.LEFT;
      break;
    default:
      goog.asserts.fail('Internal error: invalid position');
      break;
  }

  goog.asserts.assert(arrow !== null, 'arrow badly initialized');
  this.tooltip_.showArrow(
      /** @type {xcov.ui.Tooltip.Arrow} */ (arrow), pos);
};


/****************************************************************
 * xcov.positioning.TooltipPosition.handleLeftAndRightPosition_ *
 ****************************************************************/


/**
 * Handles the case where the tooltip has to be positioned either on the left
 * or on the right of the target element.
 *
 * @param {goog.math.Coordinate} preferredCoordinate The preferred position.
 * @param {goog.math.Rect} anchorBounds The anchor's bounds.
 * @param {goog.math.Size} anchorSize The anchor's size.
 * @param {goog.math.Size} elementSize The element's size.
 * @param {goog.math.Box} elementMarginBox The element's margin box.
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box} vpbox Viewport box object.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 * @param {goog.math.Size=} opt_preferredSize PreferredSize of the
 *    movableElement. Defaults to the current size.
 * @return {{overflowed: boolean, coordinate: goog.math.Coordinate}} A tuple
 *    containing a boolean sets to true if the popup still overflows after the
 *    computation, and the last coordinate set for the popup.
 * @private
 */
xcov.positioning.TooltipPosition.prototype.handleLeftAndRightPosition_ =
    function(preferredCoordinate, anchorBounds, anchorSize, elementSize,
             elementMarginBox, movableElement, movableCorner, vpbox, opt_margin,
             opt_preferredSize) {

  var status = goog.positioning.positionAtCoordinate(preferredCoordinate,
      movableElement, movableCorner, opt_margin, vpbox,
      goog.positioning.Overflow.FAIL_Y, opt_preferredSize);

  if (status === goog.positioning.OverflowStatus.NONE /* no overflow */ ||
      (status & goog.positioning.OverflowStatus.FAILED_TOP &&
       status & goog.positioning.OverflowStatus.FAILED_BOTTOM)) {
    // Either overflow both on left and right or no overflow at all. We
    // center the popup's arrow and exit.
    this.setArrowPosition_(Math.ceil(elementSize.height / 2) - 6);

    // Return false since it is known that the popup overflows.
    return {
      overflowed: status !== goog.positioning.OverflowStatus.NONE,
      coordinate: preferredCoordinate
    };
  }

  /** @type {goog.math.Coordinate} */ var ajustedCoordinate = null;

  if (status & goog.positioning.OverflowStatus.FAILED_TOP) {
    ajustedCoordinate = new goog.math.Coordinate(
        preferredCoordinate.x                   /* opt_x */,
        anchorBounds.top - elementMarginBox.top /* opt_y */);
    this.setArrowPosition_(Math.ceil(anchorSize.height / 2));
  } else {
    goog.asserts.assert(
        status & goog.positioning.OverflowStatus.FAILED_BOTTOM,
        'status should be FAILED_BOTTOM');

    ajustedCoordinate = new goog.math.Coordinate(
        preferredCoordinate.x   /* opt_x */,
        anchorBounds.top + anchorSize.height - elementSize.height +
        elementMarginBox.bottom /* opt_y */);

    this.setArrowPosition_(
        elementSize.height - Math.ceil(anchorSize.height / 2));
  }

  status = goog.positioning.positionAtCoordinate(ajustedCoordinate,
      movableElement, movableCorner, opt_margin, vpbox,
      null /* opt_overflow */, opt_preferredSize);

  return {
    overflowed: !!(status & goog.positioning.OverflowStatus.FAILED),
    coordinate: ajustedCoordinate
  };
};


/*****************************************************************
 * xcov.positioning.TooltipPosition.handleAboveAndBelowPosition_ *
 *****************************************************************/


/**
 * Handles the case where the tooltip has to be positioned either above or
 * below the target element.
 *
 * @param {goog.math.Coordinate} preferredCoordinate The preferred position.
 * @param {goog.math.Rect} anchorBounds The anchor's bounds.
 * @param {goog.math.Size} anchorSize The anchor's size.
 * @param {goog.math.Size} elementSize The element's size.
 * @param {goog.math.Box} elementMarginBox The element's margin box.
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box} vpbox Viewport box object.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 * @param {goog.math.Size=} opt_preferredSize PreferredSize of the
 *    movableElement. Defaults to the current size.
 * @return {{overflowed: boolean, coordinate: goog.math.Coordinate}} A tuple
 *    containing a boolean sets to true if the popup still overflows after the
 *    computation, and the last coordinate set for the popup.
 * @private
 */
xcov.positioning.TooltipPosition.prototype.handleAboveAndBelowPosition_ =
    function(preferredCoordinate, anchorBounds, anchorSize, elementSize,
             elementMarginBox, movableElement, movableCorner, vpbox,
             opt_margin, opt_preferredSize) {


  var status = goog.positioning.positionAtCoordinate(preferredCoordinate,
      movableElement, movableCorner, opt_margin, vpbox,
      goog.positioning.Overflow.FAIL_X, opt_preferredSize);

  if (status === goog.positioning.OverflowStatus.NONE /* no overflow */ ||
      (status & goog.positioning.OverflowStatus.FAILED_LEFT &&
       status & goog.positioning.OverflowStatus.FAILED_RIGHT)) {
    // Either overflow both on left and right or no overflow at all. We
    // center the popup's arrow and exit.
    this.setArrowPosition_(Math.ceil(elementSize.width / 2) - 2);

    // Return false since it is known that the popup overflows.
    return {
      overflowed: status !== goog.positioning.OverflowStatus.NONE,
      coordinate: preferredCoordinate
    };
  }

  /** @type {goog.math.Coordinate} */ var ajustedCoordinate = null;

  if (status & goog.positioning.OverflowStatus.FAILED_LEFT) {
    ajustedCoordinate = new goog.math.Coordinate(
        anchorBounds.left - elementMarginBox.left /* opt_x */,
        preferredCoordinate.y                     /* opt_y */);

    this.setArrowPosition_(Math.ceil(anchorSize.width / 2));
  } else {
    goog.asserts.assert(
        status & goog.positioning.OverflowStatus.FAILED_RIGHT,
        'status should be FAILED_RIGHT');

    ajustedCoordinate = new goog.math.Coordinate(
        anchorBounds.left + anchorSize.width - elementSize.width,
        preferredCoordinate.y  /* opt_y */);

    this.setArrowPosition_(
        elementSize.width - Math.ceil(anchorSize.width / 2));
  }

  status = goog.positioning.positionAtCoordinate(ajustedCoordinate,
      movableElement, movableCorner, opt_margin, vpbox,
      goog.positioning.Overflow.FAIL_X | goog.positioning.Overflow.FAIL_Y,
      opt_preferredSize);

  return {
    overflowed: !!(status & goog.positioning.OverflowStatus.FAILED),
    coordinate: ajustedCoordinate
  };
};


/**************************************************
 * xcov.positioning.TooltipPosition.flipPosition_ *
 **************************************************/


/**
 * Flips the arrow position. This is used to quickly try repositioning the
 * tooltip in case of overflow with the viewport.
 *
 * @private
 */
xcov.positioning.TooltipPosition.prototype.flipPosition_ = function() {
  /** @type {?xcov.ui.Tooltip.Position} */ var position = null;

  switch (this.position_) {
    case xcov.ui.Tooltip.Position.ABOVE:
      position = xcov.ui.Tooltip.Position.BELOW;
      break;
    case xcov.ui.Tooltip.Position.BELOW:
    case xcov.ui.Tooltip.Position.DEFAULT:
      position = xcov.ui.Tooltip.Position.ABOVE;
      break;
    case xcov.ui.Tooltip.Position.LEFT:
      position = xcov.ui.Tooltip.Position.RIGHT;
      break;
    case xcov.ui.Tooltip.Position.RIGHT:
      position = xcov.ui.Tooltip.Position.LEFT;
      break;
    default:
      goog.asserts.fail('Internal error: invalid position');
      break;
  }

  goog.asserts.assert(position !== null, 'position badly initialized');
  this.position_ = /** @type {xcov.ui.Tooltip.Position} */ (position);
};


/***********************************************
 * xcov.positioning.TooltipPosition.reposition *
 ***********************************************/


/**
 * Repositions the movable element.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 * @param {goog.math.Size=} opt_preferredSize PreferredSize of the
 *     movableElement (unused in this class).
 */
xcov.positioning.TooltipPosition.prototype.reposition = function(
    movableElement, movableCorner, opt_margin, opt_preferredSize) {

  // Get viewport size and compute its box, which is used by the
  // goog.positioning.positionAtCoordinate algorithm.
  var vpsize = this.tooltip_.getDomHelper().getViewportSize();
  var vpbox = new goog.math.Box(0, vpsize.width, vpsize.height, 0);

  // Get the rectangle defining the boundaries of the element.  It is used in
  // the algorithm to compute the exact position of the popup.
  var anchorBounds = goog.style.getBounds(this.anchor_);
  var anchorSize = goog.style.getBorderBoxSize(this.anchor_);
  var elementSize = goog.style.getBorderBoxSize(movableElement);
  // The margin is taken onto the first child of the popup which is the content
  // child that defines a margin in the default style.
  var elementMarginBox = goog.style.getMarginBox(
      /** @type {Element} */ (movableElement.firstChild));

  var leftRightMargin = new goog.math.Box(0, xcov.ui.Tooltip.DEFAULT_MARGIN,
                                          0, xcov.ui.Tooltip.DEFAULT_MARGIN);

  var aboveBelowMargin = new goog.math.Box(xcov.ui.Tooltip.DEFAULT_MARGIN, 0,
                                           xcov.ui.Tooltip.DEFAULT_MARGIN, 0);

  var margin = opt_margin || new goog.math.Box(xcov.ui.Tooltip.DEFAULT_MARGIN,
                                               xcov.ui.Tooltip.DEFAULT_MARGIN,
                                               xcov.ui.Tooltip.DEFAULT_MARGIN,
                                               xcov.ui.Tooltip.DEFAULT_MARGIN);

  var coordinate = this.getPreferredPosition_(anchorBounds, anchorSize,
      elementSize);

  // When explicit position is requested, we only try to fit horizontally in
  // the case of ABOVE and BELOW, and fit vertically in the case of LEFT or
  // RIGHT. If the DEFAULT is used, then we first try to display the popup
  // below, then above if the first experience failed.

  if (this.position_ === xcov.ui.Tooltip.Position.LEFT ||
      this.position_ === xcov.ui.Tooltip.Position.RIGHT) {
    this.handleLeftAndRightPosition_(coordinate, anchorBounds, anchorSize,
        elementSize, elementMarginBox, movableElement, movableCorner, vpbox,
        leftRightMargin, opt_preferredSize);
    return;
  }

  if (this.position_ === xcov.ui.Tooltip.Position.ABOVE ||
      this.position_ === xcov.ui.Tooltip.Position.BELOW) {
    this.handleAboveAndBelowPosition_(coordinate, anchorBounds, anchorSize,
        elementSize, elementMarginBox, movableElement, movableCorner, vpbox,
        aboveBelowMargin, opt_preferredSize);
    return;
  }

  // Handle the case where the position is set to DEFAULT.
  goog.asserts.assert(this.position_ === xcov.ui.Tooltip.Position.DEFAULT,
      'position should be DEFAULT');
  this.position_ = xcov.ui.Tooltip.Position.BELOW;

  var result = this.handleAboveAndBelowPosition_(coordinate, anchorBounds,
      anchorSize, elementSize, elementMarginBox, movableElement, movableCorner,
      vpbox, aboveBelowMargin, opt_preferredSize);

  if (result.overflowed) {
    // Try the reverse on fail.
    this.flipPosition_();

    coordinate = this.getPreferredPosition_(anchorBounds, anchorSize,
        elementSize);

    result = this.handleAboveAndBelowPosition_(coordinate, anchorBounds,
        anchorSize, elementSize, elementMarginBox, movableElement,
        movableCorner, vpbox, aboveBelowMargin, opt_preferredSize);

    if (result.overflowed) {
      // Force the original position if any other attempt to make it fit into
      // the viewport failed.
      this.flipPosition_();

      coordinate = this.getPreferredPosition_(anchorBounds, anchorSize,
          elementSize);

      goog.positioning.positionAtCoordinate(coordinate, movableElement,
          movableCorner, margin, null /* opt_viewport */,
          null /* opt_overflow */, opt_preferredSize);

      this.setArrowPosition_(Math.ceil(elementSize.width / 2));
    }
  }
};
