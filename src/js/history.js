/**
 * @fileoverview Extends the {@code goog.history.Html5History} class to fix an
 *    issue regarding the POPSTATE event generating a
 *    {@code goog.history.Event} inconsistent with the {@code goog.History}
 *    implementation.
 *    See https://code.google.com/p/closure-library/issues/detail?id=449 for
 *    more information.
 */


goog.provide('xcov.history.Html5History');

goog.require('goog.history.Html5History');


/***************************************
 * goog.history.Html5History.getWindow *
 ***************************************/


/**
 * @return {Window} The window object to use for history tokens.  Typically
 *    the top window.
 * @protected
 */
goog.history.Html5History.prototype.getWindow = function() {
  return this.window_;
};


/************************************************
 * goog.history.Html5History.getHistoryCallback *
 ************************************************/


/**
 * @return {Function} The callback fired on history event.
 * @protected
 */
goog.history.Html5History.prototype.getHistoryCallback = function() {
  return this.onHistoryEvent_;
};


/*****************************
 * xcov.history.Html5History *
 *****************************/



/**
 * Extends {@code goog.history.Html5History}.
 *
 * @param {Window=} opt_win The window to listen/dispatch history events on.
 * @param {goog.history.Html5History.TokenTransformer=} opt_transformer
 *     The token transformer that is used to create URL from the token
 *     when storing token without using hash fragment.
 * @constructor
 * @extends {goog.history.Html5History}
 */
xcov.history.Html5History = function(opt_win, opt_transformer) {
  goog.base(this, opt_win, opt_transformer);

  goog.events.unlisten(this.getWindow(), goog.events.EventType.POPSTATE,
      this.getHistoryCallback(), false, this);
};
goog.inherits(xcov.history.Html5History, goog.history.Html5History);
