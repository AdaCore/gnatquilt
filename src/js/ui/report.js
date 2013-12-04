/**
 * @fileoverview Top-level UI element.
 */


goog.provide('xcov.ui.Report');

goog.require('goog.asserts');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.ui.Component');
goog.require('goog.userAgent');

goog.require('xcov.Report');
goog.require('xcov.style');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.Tooltip');
goog.require('xcov.ui.views.Source');
goog.require('xcov.ui.views.Summary');
goog.require('xcov.ui.views.Traces');


/******************
 * xcov.ui.Report *
 ******************/



/**
 * Top-level UI element aggregating the sub-components. It generates the HTML
 * report from it. That report is directly injected into the current HTML page.
 *
 * @param {!xcov.Report} report The analysed coverage report.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.Report = function(report, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.ui.Report');

  /**
   * @type {xcov.Report}
   * @const
   * @private
   */
  this.report_ = report;

  /**
   * @type {goog.ui.Component} The cached summary widget if already rendered.
   * @private
   */
  this.summaryView_ = null;

  /**
   * @type {goog.ui.Component} The cached widget for browsing trace files.
   * @private
   */
  this.tracesView_ = null;

  /**
   * @type {goog.ui.Component} The cached widget for the current source file.
   * @private
   */
  this.sourceView_ = null;

  /**
   * @type {?xcov.ui.Tooltip} The global tooltip instance shared by all widgets
   *    in this report. Disabled on mobile device since this does not play nice
   *    with touch screens (i.e. hover on first click, actual click on second
   *    click).
   */
  this.tooltip = goog.userAgent.MOBILE ? null :
      new xcov.ui.Tooltip(this.getDomHelper());
};
goog.inherits(xcov.ui.Report, goog.ui.Component);


/****************************
 * xcov.ui.Report.getReport *
 ****************************/


/**
 * @return {!xcov.Report} The coverage report object.
 */
xcov.ui.Report.prototype.getReport = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.report_), 'compiler check');
  return this.report_;
};


/**********************************
 * xcov.ui.Report.disposeInternal *
 **********************************/


/** @inheritDoc */
xcov.ui.Report.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  goog.dispose(this.summaryView_);
  this.summaryView_ = null;

  goog.dispose(this.tracesView_);
  this.tracesView_ = null;

  goog.dispose(this.sourceView_);
  this.sourceView_ = null;
};


/****************************
 * xcov.ui.Report.createDom *
 ****************************/


/** @inheritDoc */
xcov.ui.Report.prototype.createDom = function() {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var css = goog.getCssName(xcov.style.CSS_CLASS, 'report');

  /** @const */ var titleDom =
      dom.createDom(goog.dom.TagName.H1, goog.getCssName(css, 'title'),
          'GNATcoverage report');

  /** @const */ var levelDom =
      dom.createDom(goog.dom.TagName.H2, goog.getCssName(css, 'coverage-level'),
          'Coverage level: ' + this.report_.getCoverageLevel());

  /** @const */ var contentDom =
      dom.createDom(goog.dom.TagName.DIV, goog.getCssName(css, 'content'));

  this.setElementInternal(
      dom.createDom(goog.dom.TagName.DIV, css, titleDom, levelDom, contentDom));
};


/********************************
 * xcov.ui.Report.enterDocument *
 ********************************/


/** @inheritDoc */
xcov.ui.Report.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  /** @const */ var handler = this.getHandler();

  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.SUMMARY,
      this.handleSummaryViewEvent);
  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.SOURCE,
      this.handleSourceViewEvent);
  handler.listen(xcov.navigation.eventTarget, xcov.navigation.Views.TRACES,
      this.handleTracesViewEvent);

  xcov.navigation.setEnabled(true);
};


/*******************************
 * xcov.ui.Report.exitDocument *
 *******************************/


/** @inheritDoc */
xcov.ui.Report.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');

  xcov.navigation.setEnabled(false);
  this.getHandler().removeAll();
};


/************************************
 * xcov.ui.Report.getContentElement *
 ************************************/


/** @inheritDoc */
xcov.ui.Report.prototype.getContentElement = function() {
  return this.getDomHelper().getLastElementChild(this.getElement());
};


/*****************************
 * xcov.ui.Report.importHunk *
 *****************************/


/**
 * Imports a hunk by loading the file pointed to by {@code hunkFilename} by
 * inserting a {@code <script>} tag in the roort document's {@code <head>}
 * section.
 *
 * @param {string} hunkFilename The name of thi file to import.
 * @private
 */
xcov.ui.Report.prototype.importHunk_ = function(hunkFilename) {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var script = dom.createDom(goog.dom.TagName.SCRIPT, {
    'type': 'text/javascript',
    'src': hunkFilename
  });

  this.logger_.info('Loading hunk: ' + hunkFilename);
  dom.getDocument().head.appendChild(script);
};


/*****************************
 * xcov.ui.Report.hunkLoaded *
 *****************************/


/**
 * Loads and analyses the hunk. Once done, displays the associated source view.
 *
 * @param {Object} hunk The JSON hunk to load.
 */
xcov.ui.Report.prototype.hunkLoaded = function(hunk) {
  /** @const */ var source = this.report_.loadHunk(hunk);

  // ???: check for possible null return value.
  goog.asserts.assert(goog.isDefAndNotNull(source), '??? check for null');
  this.openSourceFile_(source);
};


/*********************************
 * xcov.ui.Report.getSummaryView *
 *********************************/


/**
 * @return {!goog.ui.Component} The summary widget.
 */
xcov.ui.Report.prototype.getSummaryView = function() {
  if (goog.isNull(this.summaryView_)) {
    goog.asserts.assert(goog.isDefAndNotNull(this.report_), 'compiler check');

    this.summaryView_ =
        new xcov.ui.views.Summary(this.report_, this.getDomHelper());
  }

  return this.summaryView_;
};


/********************************
 * xcov.ui.Report.getTracesView *
 ********************************/


/**
 * @return {!goog.ui.Component} The trace widget.
 */
xcov.ui.Report.prototype.getTracesView = function() {
  if (goog.isNull(this.tracesView_)) {
    goog.asserts.assert(goog.isDefAndNotNull(this.report_), 'compiler check');

    this.tracesView_ =
        new xcov.ui.views.Traces(this.report_.getTraces(), this.getDomHelper());
  }

  return this.tracesView_;
};


/********************************
 * xcov.ui.Report.getSourceView *
 ********************************/


/**
 * Returns the source view to use to display the requested source file.
 * Dispose of any previously allocated view if needed.
 *
 * @param {!xcov.SourceFile} source The source to display.
 * @return {!goog.ui.Component} A source view widget.
 */
xcov.ui.Report.prototype.getSourceView = function(source) {
  /** @const */ var dom = this.getDomHelper();
  /** @const */ var filename = source.getFilename();

  /**
   * @return {!goog.ui.Component} The source view for filename.
   */
  function createSourceView() {
    return new xcov.ui.views.Source(source, dom);
  }

  if (goog.isNull(this.sourceView_)) {
    this.sourceView_ = createSourceView();

  } else if (this.sourceView_.getSource().getFilename() !== filename) {
    // Update the source view only if it's not already displaying the requested
    // source.

    goog.dispose(this.sourceView_);
    this.sourceView_ = createSourceView();
  }

  return this.sourceView_;
};


/**********************************
 * xcov.ui.Report.openSourceFile_ *
 **********************************/


/**
 * Displays the given source file.
 *
 * @param {!xcov.SourceFile} source The source to display.
 * @private
 */
xcov.ui.Report.prototype.openSourceFile_ = function(source) {
  this.removeChildren(true /* opt_unrender */);

  this.addChild(this.getSourceView(source), true /* opt_render */);
  this.logger_.info('Navigated to source file: ' + source.getFilename());
};


/*****************************************
 * xcov.ui.Report.handleSummaryViewEvent *
 *****************************************/


/**
 * Displays the report summary.
 * @protected
 */
xcov.ui.Report.prototype.handleSummaryViewEvent = function() {
  this.removeChildren(true /* opt_unrender */);

  this.addChild(this.getSummaryView(), true /* opt_render */);
  this.logger_.info('Navigated to summary view.');
};


/****************************************
 * xcov.ui.Report.handleTracesViewEvent *
 ****************************************/


/**
 * Displays the traces table.
 * @protected
 */
xcov.ui.Report.prototype.handleTracesViewEvent = function() {
  this.removeChildren(true /* opt_unrender */);

  this.addChild(this.getTracesView(), true /* opt_render */);
  this.logger_.info('Navigated to traces table.');
};


/****************************************
 * xcov.ui.Report.handleSourceViewEvent *
 ****************************************/


/**
 * Displays the source file for the given filename, or an error page if no
 * source file can be found for that filename.
 *
 * @param {xcov.navigation.Event} e The navigation event.
 * @protected
 */
xcov.ui.Report.prototype.handleSourceViewEvent = function(e) {
  if (!goog.isDefAndNotNull(e.filename)) {
    this.logger_.warning('Unexpected empty value for source filename.');
    this.logger_.warning('Fallback to summary view.');
    this.handleSummaryViewEvent();
    return;
  }

  /** @const */ var source = this.report_.getSource(e.filename);

  if (goog.isNull(source)) {
    this.logger_.warning('Unknown source file name: ' + e.filename);
    this.logger_.warning('Fallback to summary view.');
    this.handleSummaryViewEvent();
    return;
  }

  if (!source.isCompletelyLoaded()) {
    // We need to load the data stored in a hunk file for this source.
    this.importHunk_(source.getHunkFilename());

    // The source view will be displayed once loaded.
    return;
  }

  this.openSourceFile_(source);
};
