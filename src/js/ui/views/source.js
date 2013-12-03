/**
 * @fileoverview Displays a source file.
 */


goog.provide('xcov.ui.views.Source');

goog.require('goog.ui.Component');

goog.require('xcov.Report');
goog.require('xcov.navigation');
goog.require('xcov.ui.Navigation');
goog.require('xcov.ui.SourceFile');


/************************
 * xcov.ui.views.Source *
 ************************/



/**
 * The summary view component.
 *
 * @param {!xcov.SourceFile} source The source file.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
xcov.ui.views.Source = function(source, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /** @const */ var dom = this.getDomHelper();

  /**
   * @type {xcov.SourceFile}
   * @const
   * @private
   */
  this.source_ = source;

  this.addChild(
      new xcov.ui.Navigation(
          '⇪ Up to sources list',
          xcov.navigation.getCanonicalSummaryTableURL(),
          dom /* opt_domHelper */),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFileTable([source], this.getDomHelper()),
      true /* opt_render */);

  this.addChild(
      new xcov.ui.SourceFile(source, this.getDomHelper()),
      true /* opt_render */);
};
goog.inherits(xcov.ui.views.Source, goog.ui.Component);


/**********************************
 * xcov.ui.views.Source.getSource *
 **********************************/


/**
 * @return {!xcov.SourceFile} The source file associated with this view.
 */
xcov.ui.views.Source.prototype.getSource = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.source_), 'compiler check');
  return this.source_;
};
