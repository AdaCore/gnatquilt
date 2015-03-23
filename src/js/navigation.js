/**
 * @fileoverview Provides navigation mechanism within the HTML report.
 *    Handles the navigation in the user interface. Reacts to the changes in the
 *    page location (the URL) and displays the relevant content accordingly.
 */


goog.provide('xcov.navigation');

goog.require('goog.Disposable');
goog.require('goog.History');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.history.EventType');
goog.require('goog.string');

goog.require('xcov.SourceFile');
goog.require('xcov.history.Html5History');


/***************************
 * xcov.navigation.logger_ *
 ***************************/


/**
 * @type {goog.debug.Logger} An custom instance of the logger for this class.
 * @const
 * @private
 */
xcov.navigation.logger_ = goog.debug.Logger.getLogger('xcov.navigation');


/****************************
 * xcov.navigation.history_ *
 ****************************/


/**
 * @type {goog.events.EventTarget} EventTarget is the common parent class for
 *    both {@code goog.History} and {@code goog.Html5History}.
 * @private
 */
xcov.navigation.history_ = goog.history.Html5History.isSupported() ?
    new xcov.history.Html5History() : new goog.History();


/*************************
 * xcov.navigation.Views *
 *************************/


/**
 * @enum {string} Enumerates the navigation path available. Add a trailing '/'
 *    for path that expects a payload (e.g. /source/main.adb).
 */
xcov.navigation.Views = {
  SOURCE: '/source/',
  SUMMARY: '/summary',
  TRACES: '/traces'
};


/**************************
 * xcov.navigation.Token_ *
 **************************/


/**
 * @typedef {{view: !xcov.navigation.Views, payload: ?string}}
 * @private
 */
xcov.navigation.Token_;


/***************************
 * xcov.navigation.baseURL *
 ***************************/


/**
 * @type {?string} Base URL for the HTML report. Defaults to {@code null} until
 *    the navigation engine gets initialized.
 */
xcov.navigation.baseURL = null;


/*******************************
 * xcov.navigation.eventTarget *
 *******************************/


/**
 * @type {goog.events.EventTarget} Event target on which to register to reveive
 *    XCOV HTML report navigation events.
 */
xcov.navigation.eventTarget = new goog.events.EventTarget();


/******************************
 * xcov.navigation.initialize *
 ******************************/


/**
 * Initializes the history mechanism. It first renders the XCOV report in the
 * current docement, then starts listening to the history events sent by the
 * browser.
 *
 * @param {Window=} opt_window The Window object to use.
 */
xcov.navigation.initialize = function(opt_window) {
  /** @const */ var win = opt_window || window;

  xcov.navigation.baseURL = new goog.Uri(win.location)
          .setFragment('').setQueryData(null).toString();

  goog.events.listen(xcov.navigation.history_, goog.history.EventType.NAVIGATE,
      xcov.navigation.onNavigate_);
};


/******************************
 * xcov.navigation.setEnabled *
 ******************************/


/**
 * Starts or stops the History. When enabled, the History object will
 * immediately fire an event for the current location. The caller can set up
 * event listeners between the call to the constructor and the call to
 * {@code setEnabled}.
 *
 * @param {boolean} enable Whether to enable history.
 */
xcov.navigation.setEnabled = function(enable) {
  xcov.navigation.history_.setEnabled(enable);
};


/****************************
 * xcov.navigation.finalize *
 ****************************/


/**
 * Stops listening to the history events sent by the browser, i.e. disable the
 * navigation mechanism.
 */
xcov.navigation.finalize = function() {
  goog.asserts.assert(goog.isDefAndNotNull(xcov.navigation.history_),
      'prevent goog.events.removeAll(null)');
  goog.events.removeAll(xcov.navigation.history_);
};


/***********************************************
 * xcov.navigation.getCanonicalSummaryTableURL *
 ***********************************************/


/**
 * @return {string} The URL pointing to the summary page of the HTML report.
 *    Returns {@code null} if the navigation engine has not been initialized
 *    yet.
 */
xcov.navigation.getCanonicalSummaryTableURL = function() {
  return goog.string.buildString(xcov.navigation.baseURL, '#',
      xcov.navigation.Views.SUMMARY);
};


/*********************************************
 * xcov.navigation.getCanonicalTraceTableURL *
 *********************************************/


/**
 * @return {string} The URL pointing to the trace list page of the HTML report.
 *    Returns {@code null} if the navigation engine has not been initialized
 *    yet.
 */
xcov.navigation.getCanonicalTraceTableURL = function() {
  return goog.string.buildString(xcov.navigation.baseURL, '#',
      xcov.navigation.Views.TRACES);
};


/*********************************************
 * xcov.navigation.getCanonicalSourceFileURL *
 *********************************************/


/**
 * Crafts an URL to the given source file name.
 *
 * @param {!xcov.SourceFile} source The source file.
 * @return {string} The URL pointing to the given source file from the HTML
 *    report.  Returns {@code null} if the navigation engine has not been
 *    initialized yet.
 */
xcov.navigation.getCanonicalSourceFileURL = function(source) {
  return goog.string.buildString(xcov.navigation.baseURL,
      '#', xcov.navigation.Views.SOURCE, source.getHunkFilename());
};


/******************************************
 * xcov.navigation.getCanonicalProjectURL *
 ******************************************/


/**
 * Crafts an URL to the given project entry.
 *
 * @param {string} project The project name.
 * @return {string} The URL pointing to the given project from the HTML
 *    report.  Returns {@code null} if the navigation engine has not been
 *    initialized yet.
 */
xcov.navigation.getCanonicalProjectURL = function(project) {
  return goog.string.buildString(xcov.navigation.baseURL,
      '#', xcov.navigation.Views.SUMMARY, '/', project);
};


/************************************
 * xcov.navigation.getProjectAnchor *
 ************************************/


/**
 * Returns an identifier for the given project.
 *
 * @param {string} project The project name.
 * @return {string} The identifier.
 */
xcov.navigation.getProjectAnchor = function(project) {
  return 'project-' + project;
};


/*********************************
 * xcov.navigation.replaceToken_ *
 *********************************/


/**
 * Replaces the current history state without affecting the rest of the history
 * stack.
 *
 * @param {string} token The history state identifier.
 * @private
 */
xcov.navigation.replaceToken_ = function(token) {
  if (goog.history.Html5History.isSupported()) {
    xcov.navigation.history_.replaceToken(token);
  } else {
    xcov.navigation.history_.setToken(token);
  }
};


/******************************
 * xcov.navigation.parseHash_ *
 ******************************/


/**
 * Parses the provided decoded hash (from the URL) and returns the analyzed
 * payload.
 *
 * @param {string} hash The decoded URL hash.
 * @return {?xcov.navigation.Token_} The analyzed navigation token. Returns
 *    {@code null} to indicates that the event has te be dropped.
 * @private
 */
xcov.navigation.parseHash_ = function(hash) {
  if (goog.string.startsWith(hash, '#')) {
    hash = goog.string.remove(hash, '#');
  }

  /**
   * @type {xcov.navigation.Token_}
   * @const
   */
  var token = {
    view: xcov.navigation.Views.SUMMARY,
    payload: null
  };

  /** @const */ var projectAnchor = xcov.navigation.Views.SUMMARY + '/';

  if (goog.string.isEmpty(hash)) {
    // token.view is already set to SUMMARY (default behavior).

  } else if (goog.string.startsWith(hash, projectAnchor)) {
    token.payload = goog.string.remove(hash, projectAnchor);

  } else if (goog.string.startsWith(hash, xcov.navigation.Views.SUMMARY)) {
    // token.view is already set to SUMMARY (default behavior).

  } else if (goog.string.startsWith(hash, xcov.navigation.Views.TRACES)) {
    token.view = xcov.navigation.Views.TRACES;

  } else if (goog.string.startsWith(hash, xcov.navigation.Views.SOURCE)) {
    token.view = xcov.navigation.Views.SOURCE;
    token.payload = goog.string.remove(hash, xcov.navigation.Views.SOURCE);

  } else {
    xcov.navigation.logger_.warning('Unrecognized URL: ' + hash);
    xcov.navigation.logger_.warning('Fallback on default view.');
    xcov.navigation.replaceToken_('');
    return null;
  }

  return token;
};


/*******************************
 * xcov.navigation.onNavigate_ *
 *******************************/


/**
 * Any changes in the location hash will call the following function.
 *
 * @param {goog.events.Event} e The history event object.
 * @private
 */
xcov.navigation.onNavigate_ = function(e) {
  /** @const */ var hash = goog.string.urlDecode(e.token);
  /** @const */ var token = xcov.navigation.parseHash_(hash);

  if (goog.isNull(token)) {
    xcov.navigation.logger_.info('Dropping navigation event: ' + hash);
    return;
  }

  if (!goog.object.containsValue(xcov.navigation.Views, token.view)) {
    goog.asserts.fail('Unexpected value for token.view: ' + token.view);
    return;
  }

  xcov.navigation.eventTarget.dispatchEvent(
      new xcov.navigation.Event(token.view, token.payload));
};


/*************************
 * xcov.navigation.Event *
 *************************/



/**
 * A base class for navigation event objects, so that they can support
 * preventDefault and stopPropagation.
 *
 * @param {xcov.navigation.Views} view The view to display.
 * @param {?string=} opt_payload Optional parameter attached to the event.
 * @param {Object=} opt_target Reference to the object that is the target of
 *      this event. It has to implement the {@code EventTarget} interface
 *      declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @constructor
 * @extends {goog.events.Event}
 */
xcov.navigation.Event = function(view, opt_payload, opt_target) {
  goog.base(this, view, opt_target);

  /**
   * @type {?string} Optional parameter used for the
   *    {@code xcov.navigation.View.SOURCE} and
   *    {@code xcov.navigation.Views.SUMMARY} views.
   */
  this.payload = opt_payload || null;
};
goog.inherits(xcov.navigation.Event, goog.events.Event);
