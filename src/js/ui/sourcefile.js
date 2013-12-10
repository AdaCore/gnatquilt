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

goog.require('xcov.Instruction');
goog.require('xcov.InstructionBlock');
goog.require('xcov.InstructionSet');
goog.require('xcov.SourceFile');
goog.require('xcov.SourceLine');
goog.require('xcov.string');
goog.require('xcov.style');
goog.require('xcov.ui.Tooltip');
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

    if (this.source_.hasAttachement(line.getNumber())) {
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

  /** @const */ var contentDom =
      dom.createDom(goog.dom.TagName.TABLE, goog.getCssName(style, 'content'),
          dom.createDom(goog.dom.TagName.TBODY, null));

  this.setElementInternal(dom.createDom(goog.dom.TagName.DIV, style,
      toolbarDom, contentDom));
};


/****************************************
 * xcov.ui.SourceFile.getContentElement *
 ****************************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.getContentElement = function() {
  /** @const */ var dom = this.getDomHelper();
  return dom.getFirstElementChild(dom.getLastElementChild(this.getElement()));
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

  /** @const */ var dom = this.getDomHelper();

  if (source.hasMessage(line.getNumber())) {
    this.addChild(
        new xcov.ui.SourceFile.LineMessage_(source, line.getNumber(), dom),
        true /* opt_render */);
  }

  if (source.hasInstructionSet(line.getNumber())) {
    this.addChild(
        new xcov.ui.SourceFile.InstructionSet_(source, line.getNumber(), dom),
        true /* opt_render */);
  }
};
goog.inherits(xcov.ui.SourceFile.Line_, goog.ui.Component);


/**************************************
 * xcov.ui.SourceFile.Line_.CSS_CLASS *
 **************************************/


/**
 * @type {string} Default CSS class for this widget.
 */
xcov.ui.SourceFile.Line_.CSS_CLASS =
    goog.getCssName(xcov.ui.SourceFile.CSS_CLASS, 'line');


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
  /** @const */ var style = xcov.ui.SourceFile.Line_.CSS_CLASS;

  /** @const */ var bgStyle = this.line_.getNumber() % 2 === 0 ?
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

  xcov.ui.Tooltip.attach(coverageSymbolDom, status.image);

  /** @const */ var textDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'text'),
          dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'code'),
              this.line_.getText() || goog.string.Unicode.NBSP));

  if (this.source_.hasAttachement(this.line_.getNumber())) {
    /** @const */ var markDom = dom.createDom(goog.dom.TagName.SPAN,
        goog.getCssName(style, 'mark'), dom.htmlToDocumentFragment('&#9002;'));

    xcov.ui.Tooltip.attach(markDom, 'Click to expand');
    dom.insertChildAt(lineNoDom, markDom, 0 /* index */);

    this.messageDom_ = dom.createDom(goog.dom.TagName.DIV,
        goog.getCssName(style, 'message'));
  }

  /** @const */ var rowStyle =
      goog.getCssName(xcov.ui.SourceFile.CSS_CLASS, 'row');

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.TR,
          [bgStyle, style, xcov.getCssName(style, status.style)],
          dom.createDom(goog.dom.TagName.TD,
              goog.getCssName(rowStyle, 'line-no'), lineNoDom),
          dom.createDom(goog.dom.TagName.TD,
              goog.getCssName(rowStyle, 'cov-symbol'), coverageSymbolDom),
          dom.createDom(goog.dom.TagName.TD,
              goog.getCssName(rowStyle, 'text'), textDom,
          this.messageDom_)));
};


/**********************************************
 * xcov.ui.SourceFile.Line_.getContentElement *
 **********************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.getContentElement = function() {
  return this.messageDom_;
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
  /** @const */ var method = e.expanded ?
      goog.dom.classes.add : goog.dom.classes.remove;

  method(this.getElement(),
      goog.getCssName(xcov.ui.SourceFile.Line_.CSS_CLASS, 'expanded'));

  e.target = this;
  this.dispatchEvent(e);
};


/******************************************
 * xcov.ui.SourceFile.Line_.enterDocument *
 ******************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var numberDom = dom.getFirstElementChild(this.getElement());
  /** @const */ var coverageDom = dom.getNextElementSibling(numberDom);
  /** @const */ var textDom = dom.getFirstElementChild(
      dom.getNextElementSibling(coverageDom));

  if (!goog.isNull(this.messageDom_)) {
    goog.asserts.assert(goog.isNull(this.zippy_));

    this.zippy_ = new goog.ui.Zippy(numberDom,
        this.messageDom_, false /* opt_expanded */);

    this.getHandler().listen(this.zippy_, goog.ui.Zippy.Events.TOGGLE,
        this.handleZippyToggleEvent);
  }

  this.getHandler().listen(coverageDom, goog.events.EventType.CLICK,
      this.handleRowClick_);

  this.getHandler().listen(textDom, goog.events.EventType.CLICK,
      this.handleRowClick_);
};


/********************************************
 * xcov.ui.SourceFile.Line_.handleRowClick_ *
 ********************************************/


/**
 * Toggles the zippy.
 *
 * @private
 */
xcov.ui.SourceFile.Line_.prototype.handleRowClick_ = function() {
  this.zippy_.toggle();
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


/********************************
 * xcov.ui.SourceFile.Attached_ *
 ********************************/



/**
 * A generic attachement to a line.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 * @private
 */
xcov.ui.SourceFile.Attached_ = function(opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(xcov.ui.SourceFile.Attached_, goog.ui.Component);


/******************************************
 * xcov.ui.SourceFile.Attached_.CSS_CLASS *
 ******************************************/


/**
 * @type {string} Default CSS class for this widget.
 * @const
 */
xcov.ui.SourceFile.Attached_.CSS_CLASS =
    goog.getCssName(xcov.ui.SourceFile.Line_.CSS_CLASS, 'attached');


/******************************************
 * xcov.ui.SourceFile.Attached_.createDom *
 ******************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Attached_.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var style = xcov.ui.SourceFile.Attached_.CSS_CLASS;

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.TABLE,
          xcov.ui.SourceFile.Attached_.CSS_CLASS,
          dom.createDom(goog.dom.TagName.TBODY, null)));
};


/************************************
 * xcov.ui.SourceFile.Attached_.Row *
 ************************************/



/**
 * A row in the attached section.
 *
 * @param {?goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @param {...(Node|string)} var_args DOM nodes or strings for text nodes.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.SourceFile.Attached_.Row = function(opt_domHelper, var_args) {
  goog.base(this, opt_domHelper);

  /**
   * @type {Array.<Node|string>}
   * @const
   * @private
   */
  this.cells_ = goog.array.slice(arguments, 1 /* start */);
};
goog.inherits(xcov.ui.SourceFile.Attached_.Row, goog.ui.Component);


/**********************************************
 * xcov.ui.SourceFile.Attached_.Row.createDom *
 **********************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Attached_.Row.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();

  /** @const */ var tr = dom.createDom(goog.dom.TagName.TR,
      goog.getCssName(xcov.ui.SourceFile.Attached_.CSS_CLASS, 'row'));

  goog.array.forEach(this.cells_, function(cell) {
    dom.appendChild(tr, dom.createDom(goog.dom.TagName.TD, null, cell));
  });

  this.setElementInternal(tr);
};


/***********************************
 * xcov.ui.SourceFile.LineMessage_ *
 ***********************************/



/**
 * A message associated with a line.
 *
 * @param {!xcov.SourceFile} source The source file.
 * @param {number} lineno The source line number.
 * @param {goog.dom.DomHelper=} opt_domHelper optional DOM helper.
 * @constructor
 * @extends {xcov.ui.SourceFile.Attached_}
 * @private
 */
xcov.ui.SourceFile.LineMessage_ = function(source, lineno, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();

  source.forEachMessage(lineno, function(message) {
    /** @const */ var buf = new goog.string.StringBuffer();

    if (message.hasSCO()) {
      /** @const */ var fragment =
          source.getCoverageInfo(message.getSCOUniqueId());

      buf.append('<span class="',
          goog.getCssName(xcov.ui.SourceFile.Attached_.CSS_CLASS, 'sco'),
          '">', fragment.getDescription(), '</span>: ');
    }

    buf.append(message.getMessage());

    /** @const */ var style =
        goog.getCssName(xcov.ui.SourceFile.Attached_.CSS_CLASS, 'message');

    this.addChild(
        new xcov.ui.SourceFile.Attached_.Row(dom, message.getKind(),
            dom.createDom(goog.dom.TagName.TD,
                goog.getCssName(style, 'label'), message.getKind()),
            dom.createDom(goog.dom.TagName.TD,
                goog.getCssName(style, 'body'),
                goog.dom.htmlToDocumentFragment(buf.toString()))),
        true /* opt_render */);
  }, this /* opt_obj */);
};
goog.inherits(xcov.ui.SourceFile.LineMessage_,
              xcov.ui.SourceFile.Attached_);


/**************************************
 * xcov.ui.SourceFile.InstructionSet_ *
 **************************************/



/**
 * The instruction set attached to that line.
 *
 * @param {!xcov.SourceFile} source The source file.
 * @param {number} lineno The source line number.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {xcov.ui.SourceFile.Attached_}
 * @private
 */
xcov.ui.SourceFile.InstructionSet_ = function(source, lineno, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();
  /** @const */ var style =
      goog.getCssName(xcov.ui.SourceFile.Attached_.CSS_CLASS, 'insn');

  /** @const */ var offsetStyle = goog.getCssName(style, 'offset');
  /** @const */ var addressStyle = goog.getCssName(style, 'address');
  /** @const */ var asmStyle = goog.getCssName(style, 'asm');

  /** @const */ var symbolStyle = goog.getCssName(style, 'symbol');

  source.forEachInstructionSet(lineno, function(insnSet) {
    insnSet.forEachInstructionBlock(function(insnBlock) {
      this.addChild(
          new xcov.ui.SourceFile.Attached_.Row(dom,
              dom.createDom(goog.dom.TagName.DIV,
                  [offsetStyle, symbolStyle],
                  xcov.string.normalizeHexadecimal(insnBlock.getOffset())),
              dom.createDom(goog.dom.TagName.DIV, addressStyle),
              dom.createDom(goog.dom.TagName.DIV, addressStyle),
              dom.createDom(goog.dom.TagName.DIV,
                  [asmStyle, symbolStyle], insnBlock.getSymbolName())),
          true /* opt_render */);

      /** @const */ var covStyle = goog.getCssName(style, 'coverage');

      insnBlock.forEachInstruction(function(insn) {
        /** @const */ var status = insn.getCoverage();
        /** @const */ var coverageSymbolDom =
            dom.createDom(goog.dom.TagName.DIV,
                [covStyle, xcov.getCssName(covStyle, status.style)],
                dom.htmlToDocumentFragment(status.displaySymbol));

        xcov.ui.Tooltip.attach(coverageSymbolDom, status.image);

        this.addChild(
            new xcov.ui.SourceFile.Attached_.Row(dom,
                dom.createDom(goog.dom.TagName.DIV, offsetStyle),
                dom.createDom(goog.dom.TagName.DIV, addressStyle,
                    xcov.string.normalizeHexadecimal(insn.getAddress())),
                coverageSymbolDom,
                dom.createDom(goog.dom.TagName.DIV, asmStyle,
                    insn.getAssembly())),
            true /* opt_render */);
      }, this /* opt_obj */);
    }, this /* opt_obj */);
  }, this /* opt_obj */);
};
goog.inherits(xcov.ui.SourceFile.InstructionSet_,
              xcov.ui.SourceFile.Attached_);
