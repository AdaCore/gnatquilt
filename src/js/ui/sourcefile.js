/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.SourceFile');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.string.StringBuffer');
goog.require('goog.string.Unicode');
goog.require('goog.ui.Component');
goog.require('goog.ui.Zippy');

goog.require('xcov.SourceFile');
goog.require('xcov.SourceLine');
goog.require('xcov.style');
goog.require('xcov.ui.progress');


/**********************
 * xcov.ui.SourceFile *
 **********************/



/**
 * An annotated source file.
 *
 * @param {!xcov.SourceFile} source The source file model.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFile = function(source, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.SourceFile');

  /**
   * @type {xcov.SourceFile}
   * @const
   * @private
   */
  this.source_ = source;

  /**
   * @type {Array.<!xcov.ui.SourceFile.Line_>} Lines's zippies.
   * @private
   */
  this.zippies_ = [];

  /** @const */ var dom = this.getDomHelper();

  this.source_.forEachLine(function(line) {
    goog.asserts.assert(!goog.isNull(line), 'compiler check');

    /** @const */ var l = new xcov.ui.SourceFile.Line_(source, line, dom);

    if (source.hasMessage(line.getNumber())) {
      this.zippies_.push(l);
    }

    this.addChild(l, true /* opt_render */);
  }, this /* opt_obj */);
};
goog.inherits(xcov.ui.SourceFile, goog.ui.Component);


/********************************
 * xcov.ui.SourceFile.CSS_CLASS *
 ********************************/


/**
 * @type {string} Default CSS class for this widget.
 */
xcov.ui.SourceFile.CSS_CLASS = goog.getCssName(xcov.style.CSS_CLASS, 'source');


/****************************************
 * xcov.ui.SourceFile.autoRollCheckbox_ *
 ****************************************/


/**
 * @type {?Element} DOM element for the auto-roll checkbox. Initialized in the
 *    {@code #createDom} method.
 * @private
 */
xcov.ui.SourceFile.prototype.autoRollCheckbox_ = null;


/*****************************************
 * xcov.ui.SourceFile.pendingAnimations_ *
 *****************************************/


/**
 * @type {number} Count of pending animations (waiting for completion). Used to
 *    display the progress bar on actions such as Expand/Collapse all.
 * @private
 */
xcov.ui.SourceFile.prototype.pendingAnimations_ = 0;


/***************************************
 * xcov.ui.SourceFile.totalAnimations_ *
 ***************************************/


/**
 * @type {number} Total number of animations to be excecuted.
 * @private
 */
xcov.ui.SourceFile.prototype.totalAnimations_ = 0;


/**************************************
 * xcov.ui.SourceFile.disposeInternal *
 **************************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  goog.disposeAll(this.removeChildren(true /* opt_unrender */));
};


/********************************
 * xcov.ui.SourceFile.createDom *
 ********************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style = xcov.ui.SourceFile.CSS_CLASS;

  this.autoRollCheckbox_ = dom.createDom(goog.dom.TagName.INPUT, {
    'type': 'checkbox',
    'checked': true,
    'class': goog.getCssName(style, 'autoroll')
  });

  /** @const */ var toolbarDom = dom.createDom(goog.dom.TagName.DIV,
      goog.getCssName(style, 'toolbar'),
      dom.createDom(goog.dom.TagName.BUTTON,
          goog.getCssName(style, 'toggle-expanded'), 'Expand all'),
      dom.createDom(goog.dom.TagName.BUTTON,
          goog.getCssName(style, 'toggle-collapse'), 'Collapse all'),
      this.autoRollCheckbox_,
      dom.createDom(goog.dom.TagName.SPAN, null, 'Auto Collapse'));

  /** @const */ var contentDom = dom.createDom(goog.dom.TagName.DIV,
      goog.getCssName(style, 'content'));

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, style,
      toolbarDom, contentDom));
};


/****************************************
 * xcov.ui.SourceFile.getContentElement *
 ****************************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.getContentElement = function() {
  return this.getDomHelper().getLastElementChild(this.getElement());
};


/**********************************
 * xcov.ui.SourceFile.hasAutoRoll *
 **********************************/


/**
 * @return {boolean} Whether the checkbox button for automatic expand/collapse
 *    handling is checked or not.
 */
xcov.ui.SourceFile.prototype.hasAutoRoll = function() {
  return this.autoRollCheckbox_.checked;
};


/**********************************
 * xcov.ui.SourceFile.setAutoRoll *
 **********************************/


/**
 * Checks or unchecks the auto roll checkbox.
 *
 * @param {boolean} autoRoll Whether to activate or deactivate auto-roll.
 */
xcov.ui.SourceFile.prototype.setAutoRoll = function(autoRoll) {
  this.autoRollCheckbox_.checked = autoRoll;
};


/*********************************************
 * xcov.ui.SourceFile.handleZippyToggleEvent *
 *********************************************/


/**
 * Custom handler for the zippy events that come from the child lines.
 * This is used to keep the count of expanded/collapsed lines.
 *
 * @param {goog.ui.ZippyEvent} e A zippy event object.
 * @protected
 */
xcov.ui.SourceFile.prototype.handleZippyToggleEvent = function(e) {
  /** @const */ var line = /** @type {xcov.ui.SourceFile.Line_} */ (e.target);

  if (e.expanded && this.hasAutoRoll()) {
    this.collapseAll([line] /* opt_exempted */);
  }
};


/************************************
 * xcov.ui.SourceFile.enterDocument *
 ************************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /** @const */ var dom = this.getDomHelper();

  /** @const */ var expandButton =
      dom.getFirstElementChild(dom.getFirstElementChild(this.getElement()));
  /** @const */ var collapseButton = dom.getNextElementSibling(expandButton);
  /** @const */ var checkboxDom = dom.getNextElementSibling(collapseButton);

  this.getHandler().listen(expandButton, goog.events.EventType.CLICK,
      goog.partial(this.expandAll, null /* opt_exempted */));

  this.getHandler().listen(collapseButton, goog.events.EventType.CLICK,
      goog.partial(this.collapseAll, null /* opt_exempted */));

  this.getHandler().listen(checkboxDom, goog.events.EventType.CLICK,
      this.hasAutoRoll);

  this.getHandler().listen(this, goog.ui.Zippy.Events.TOGGLE,
      this.handleZippyToggleEvent);
};


/***********************************
 * xcov.ui.SourceFile.exitDocument *
 ***********************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
  this.getHandler().removeAll();
};


/*************************************
 * xcov.ui.SourceFile.setAllExpanded *
 *************************************/


/**
 * Expands or collapses all messages.
 *
 * @param {boolean} expanded Whether to expand or collapse the messages.
 * @param {?Array.<!xcov.ui.SourceFile.Line_>=} opt_exempted Optional exempted
 *    lines that should be ignored during the processing.
 */
xcov.ui.SourceFile.prototype.setAllExpanded = function(expanded, opt_exempted) {
  // De-activate auto-roll when expanding all messages and activate in on global
  // collapse.
  this.setAutoRoll(!expanded);

  goog.object.forEach(this.zippies_,
      /**
       * Expands or collapses all messages for each line.
       *
       * @param {!xcov.ui.SourceFile.Line_} child A line.
       */
      function(child) {
        if (!goog.isDefAndNotNull(opt_exempted) ||
            !goog.array.contains(opt_exempted, child))
        {
          child.zippy_.setExpanded(expanded);
        }
      });
};


/********************************
 * xcov.ui.SourceFile.expandAll *
 ********************************/


/**
 * Expands all messages for each line.
 *
 * @param {?Array.<!xcov.ui.SourceFile.Line_>=} opt_exempted Optional exempted
 *    lines that should be ignored during the processing.
 */
xcov.ui.SourceFile.prototype.expandAll = function(opt_exempted) {
  this.setAllExpanded(true, opt_exempted);
};


/**********************************
 * xcov.ui.SourceFile.collapseAll *
 **********************************/


/**
 * Collapses all messages for each line.
 *
 * @param {?Array.<!xcov.ui.SourceFile.Line_>=} opt_exempted Optional exempted
 *    lines that should be ignored during the processing.
 */
xcov.ui.SourceFile.prototype.collapseAll = function(opt_exempted) {
  this.setAllExpanded(false, opt_exempted);
};


/****************************
 * xcov.ui.SourceFile.Line_ *
 ****************************/



/**
 * A line from a source file.
 *
 * @param {!xcov.SourceFile} source The source file.
 * @param {!xcov.SourceLine} line The line of code and its coverage analysis.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 * @private
 */
xcov.ui.SourceFile.Line_ = function(source, line, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.SourceFile}
   * @const
   * @private
   */
  this.source_ = source;

  /**
   * @type {xcov.SourceLine}
   * @const
   * @private
   */
  this.line_ = line;
};
goog.inherits(xcov.ui.SourceFile.Line_, goog.ui.Component);


/****************************************
 * xcov.ui.SourceFile.Line_.messageDom_ *
 ****************************************/


/**
 * @type {?Element} DOM element for the message section.
 * @private
 */
xcov.ui.SourceFile.Line_.prototype.messageDom_ = null;


/***********************************
 * xcov.ui.SourceFile.Line_.zippy_ *
 ***********************************/


/**
 * @type {goog.ui.Zippy} Animated zippy widget.
 * @private
 */
xcov.ui.SourceFile.Line_.prototype.zippy_ = null;


/**************************************
 * xcov.ui.SourceFile.Line_.createDom *
 **************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style =
      goog.getCssName(xcov.ui.SourceFile.CSS_CLASS, 'line');

  /** @const */ var rowStyle = this.line_.getNumber() % 2 === 0 ?
      xcov.style.ROW_EVEN_CSS_CLASS : xcov.style.ROW_ODD_CSS_CLASS;

  /** @const */ var lineNoDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'number'),
          dom.createDom(goog.dom.TagName.PRE, null,
              this.line_.getNumber().toString()));

  /** @const */ var status = this.line_.getCoverage();

  /** @const */ var coverageSymbolDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'coverage'),
          dom.createDom(goog.dom.TagName.PRE, null,
              dom.htmlToDocumentFragment(status.displaySymbol)));

  /** @const */ var textDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'text'),
          dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'code'),
              this.line_.getText() || goog.string.Unicode.NBSP));

  if (this.source_.hasMessage(this.line_.getNumber())) {
    /** @const */ var mStyle = goog.getCssName(style, 'message');

    dom.insertChildAt(lineNoDom,
        dom.createDom(goog.dom.TagName.SPAN,
            goog.getCssName(mStyle, 'mark'),
            dom.htmlToDocumentFragment('&#9002;')),
        0 /* index */);

    this.messageDom_ = dom.createDom(goog.dom.TagName.DIV, mStyle);

    this.source_.forEachMessage(this.line_.getNumber(),
        function(message, index) {
          /** @const */ var buf = new goog.string.StringBuffer();

          if (message.hasSCO()) {
            /** @const */ var fragment =
                this.source_.getCoverageInfo(message.getSCOUniqueId());
            buf.append('<span class="', goog.getCssName(mStyle, 'sco'), '">',
                fragment.getDescription(), '</span>: ');
          }

          buf.append(message.getMessage());

          dom.appendChild(this.messageDom_,
              dom.createDom(goog.dom.TagName.DIV,
                  goog.getCssName(mStyle, 'info'), message.getKind()));

          dom.appendChild(this.messageDom_,
              dom.createDom(goog.dom.TagName.DIV,
                  goog.getCssName(mStyle, 'body'),
                  dom.htmlToDocumentFragment(buf.toString())));
        }, this /* opt_obj */);
  }

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV,
          [rowStyle, style, xcov.getCssName(style, status.style)],
          lineNoDom, coverageSymbolDom, textDom, this.messageDom_));
};


/***************************************************
 * xcov.ui.SourceFile.Line_.handleZippyToggleEvent *
 ***************************************************/


/**
 * Custom handler for the zippy events.
 * Overrides the target object and rethrows the event.
 *
 * @param {goog.ui.ZippyEvent} e A zippy event object.
 * @protected
 */
xcov.ui.SourceFile.Line_.prototype.handleZippyToggleEvent = function(e) {
  e.target = this;
  this.dispatchEvent(e);
};


/******************************************
 * xcov.ui.SourceFile.Line_.enterDocument *
 ******************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  if (!goog.isNull(this.messageDom_)) {
    goog.asserts.assert(goog.isNull(this.zippy_));

    this.zippy_ = new goog.ui.Zippy(
        this.getElement(), this.messageDom_, false /* opt_expanded */);

    this.getHandler().listen(this.zippy_, goog.ui.Zippy.Events.TOGGLE,
        this.handleZippyToggleEvent);
  }
};


/*****************************************
 * xcov.ui.SourceFile.Line_.exitDocument *
 *****************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');

  this.getHandler().removeAll();

  if (!goog.isNull(this.zippy_)) {
    goog.dispose(this.zippy_);
    this.zippy_ = null;
  }
};
