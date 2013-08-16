/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.SourceFile');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.string.StringBuffer');
goog.require('goog.string.Unicode');
goog.require('goog.ui.AnimatedZippy');
goog.require('goog.ui.Component');

goog.require('xcov.SourceFile');
goog.require('xcov.SourceLine');
goog.require('xcov.style');


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

  /** @const */ var dom = this.getDomHelper();

  this.source_.forEachLine(function(line) {
    goog.asserts.assert(!goog.isNull(line), 'compiler check');

    this.addChild(
        new xcov.ui.SourceFile.Line_(source, line, dom),
        true /* opt_render */);
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

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV, xcov.ui.SourceFile.CSS_CLASS));
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
 * @type {goog.ui.AnimatedZippy} Animated zippy widget.
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
          dom.createDom(goog.dom.TagName.PRE, null, status.symbol));

  /** @const */ var textDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'text'),
          dom.createDom(goog.dom.TagName.DIV, goog.getCssName(style, 'code'),
              this.line_.getText() || goog.string.Unicode.NBSP));

  if (this.source_.hasMessage(this.line_.getNumber())) {
    /** @const */ var buf = new goog.string.StringBuffer();

    this.source_.forEachMessage(this.line_.getNumber(),
        function(message, index) {
          if (index !== 0) {
            buf.append('\n');
          }

          if (message.hasSCO()) {
            /** @const */ var fragment =
                this.source_.getSourceFragment(message.getSCOUniqueId());
            buf.append(fragment.getDescription(), ': ');
          }

          buf.append(message.getMessage());
        }, this /* opt_obj */);

    /** @const */ var mStyle = goog.getCssName(style, 'message');

    this.messageDom_ = dom.createDom(goog.dom.TagName.DIV, mStyle,
        dom.createDom(goog.dom.TagName.DIV,
            goog.getCssName(mStyle, 'info'), 'Comment'),
        dom.createDom(goog.dom.TagName.DIV,
            goog.getCssName(mStyle, 'body'), buf.toString()));
  }

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV,
          [rowStyle, style, xcov.getCssName(style, status.style)],
          lineNoDom, coverageSymbolDom, textDom, this.messageDom_));
};


/************************************
 * xcov.ui.SourceFile.enterDocument *
 ************************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  if (!goog.isNull(this.messageDom_)) {
    goog.asserts.assert(goog.isNull(this.zippy_));

    this.zippy_ = new goog.ui.AnimatedZippy(
        this.getElement(), this.messageDom_, false /* opt_expanded */);
  }
};


/***********************************
 * xcov.ui.SourceFile.exitDocument *
 ***********************************/


/** @inheritDoc */
xcov.ui.SourceFile.Line_.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');

  if (!goog.isNull(this.zippy_)) {
    goog.dispose(this.zippy_);
    this.zippy_ = null;
  }
};
