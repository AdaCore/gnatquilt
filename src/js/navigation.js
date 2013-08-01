/**
 * @fileoverview Provides navigation mechanism within the HTML report.
 *    Handles the navigation in the user interface. Reacts to the changes in the
 *    page location (the URL) and displays the relevant content accordingly.
 */


goog.provide('xcov.Navigation');

goog.require('goog.Disposable');
goog.require('goog.History');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.history.EventType');
goog.require('goog.history.Html5History');

goog.require('xcov.ui.Report');


/****************************
 * xcov.Navigation.history_ *
 ****************************/


/**
 * @type {goog.events.EventTarget} EventTarget is the common parent class for
 *    both {@code goog.History} and {@code goog.Html5History}.
 * @private
 */
xcov.Navigation.history_ = goog.history.Html5History.isSupported() ?
    new goog.history.Html5History() : new goog.History();


/***************************
 * xcov.Navigation.report_ *
 ***************************/


/**
 * @type {xcov.ui.Report}
 * @private
 */
xcov.Navigation.report_ = null;


/****************************
 * xcov.Navigation.Payload_ *
 ****************************/


/**
 * @typedef {{filename: ?string}}
 * @private
 */
xcov.Navigation.Payload_;


/******************************
 * xcov.Navigation.initialize *
 ******************************/


/**
 * Initializes the history mechanism. It first renders the XCOV report in the
 * current docement, then starts listening to the history events sent by the
 * browser.
 *
 * @param {xcov.ui.Report} report Report UI component in charge of the
 *    rendering.
 */
xcov.Navigation.initialize = function(report) {
  xcov.Navigation.report_ = report;
  xcov.Navigation.report_.render();

  goog.events.listen(xcov.Navigation.history_, goog.history.EventType.NAVIGATE,
      xcov.Navigation.onNavigate_);
};


/****************************
 * xcov.Navigation.finalize *
 ****************************/


/**
 * Stops listening to the history events sent by the browser, i.e. disable the
 * navigation mechanism.
 */
xcov.Navigation.finalize = function() {
  goog.asserts.assert(goog.isDefAndNotNull(xcov.Navigation.history_),
      'prevent goog.events.removeAll(null)');
  goog.events.removeAll(xcov.Navigation.history_);

  // Remove the report from the current document

  xcov.Navigation.report_.exitDocument();
  if (xcov.Navigation.report_.getElement()) {
    goog.dom.removeNode(xcov.Navigation.report_.getElement());
  }
};


/******************************
 * xcov.Navigation.parseHash_ *
 ******************************/


/**
 * Parses the provided decoded hash (from the URL) and returns the analyzed
 * payload.
 *
 * @param {string} hash The decoded URL hash.
 * @return {xcov.Navigation.Payload_} The analyzed payload.
 * @private
 */
xcov.Navigation.parseHash_ = function(hash) {
  /** @const */ var payload = { filename: null };

  goog.array.forEach(hash.split('&'), function(pair) {
    /** @const */ var split = pair.split('=');

    if (split[0] === 'filename') {
      payload.filename = split[1];
    }
  });

  return payload;
};


/*******************************
 * xcov.Navigation.onNavigate_ *
 *******************************/


/**
 * Any changes in the location hash will call the following function.
 *
 * @param {goog.events.Event} e The history event object.
 * @private
 */
xcov.Navigation.onNavigate_ = function(e) {
  /** @const */ var hash = goog.string.urlDecode(e.token);
  /** @const */ var payload = xcov.Navigation.parseHash_(hash);

  // Note: The UI component is expected to be not null since it is set in the
  // initialize function, before listening to history events.
  goog.asserts.assert(goog.isDefAndNotNull(xcov.Navigation.report_),
      'unexpected null or undefined report');

  if (goog.isNull(payload.filename)) {
    xcov.Navigation.report_.showSummary();
  } else {
    xcov.Navigation.report_.showSourceFile(payload.filename);
  }
};
