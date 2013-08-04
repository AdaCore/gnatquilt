/**
 * @fileoverview An annotated source file.
 */


goog.provide('xcov.ui.SourceFile');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
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
        new xcov.ui.SourceFile.Line_(line, dom),
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
      dom.createDom(goog.dom.TagName.TABLE, xcov.ui.SourceFile.CSS_CLASS,
          dom.createDom(goog.dom.TagName.TBODY, null)));
};


/****************************************
 * xcov.ui.SourceFile.getContentElement *
 ****************************************/


/** @inheritDoc */
xcov.ui.SourceFile.prototype.getContentElement = function() {
  return this.getDomHelper().getFirstElementChild(this.getElement());
};


/****************************
 * xcov.ui.SourceFile.Line_ *
 ****************************/



/**
 * A line from a source file.
 *
 * @param {!xcov.SourceLine} line The line of code and its coverage analysis.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 * @private
 */
xcov.ui.SourceFile.Line_ = function(line, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {xcov.SourceLine}
   * @const
   * @private
   */
  this.line_ = line;
};
goog.inherits(xcov.ui.SourceFile.Line_, goog.ui.Component);


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
      dom.createDom(goog.dom.TagName.TD, goog.getCssName(style, 'number'),
          dom.createDom(goog.dom.TagName.PRE, null,
              this.line_.getNumber().toString()));

  /** @const */ var status = this.line_.getCoverage();

  /** @const */ var coverageSymbolDom =
      dom.createDom(goog.dom.TagName.TD, goog.getCssName(style, 'coverage'),
          dom.createDom(goog.dom.TagName.PRE, null, status.sym));

  /** @const */ var textDom =
      dom.createDom(goog.dom.TagName.TD, goog.getCssName(style, 'text'),
          dom.createDom(goog.dom.TagName.PRE, null, this.line_.getText()));

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.TR,
          [rowStyle, xcov.getCssName(style, status.style)],
          lineNoDom, coverageSymbolDom, textDom));
};
