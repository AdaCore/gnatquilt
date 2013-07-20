/**
 * @fileoverview Handle the initialization of the logging engine. Explicitly
 *    install a logging console in non-compiled (development) mode. In
 *    compiled-mode, automatically initialize itself if '?Debug=true' is present
 *    in the web page URL.
 */


goog.provide('xcov.logging');

goog.require('goog.debug');
goog.require('goog.debug.Console');
goog.require('goog.debug.LogManager');
goog.require('goog.debug.Logger.Level');


/*************************
 * xcov.logging.console_ *
 *************************/


/**
 * @type {goog.debug.Console} Debug console instance returned by
 *    {@code xcov.logging.installConsole}.
 * @private
 */
xcov.logging.console_ = null;


/***************************
 * xcov.logging.initialize *
 ***************************/


/**
 * Initializes the logging module.
 */
xcov.logging.initialize = function() {
  goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.ALL);

  if (COMPILED) {
    xcov.logging.autoInstallConsole();
  } else {
    xcov.logging.installConsole();
  }
};


/***********************************
 * xcov.logging.autoInstallConsole *
 ***********************************/


/**
 * Automatically install the debug console in the application and start
 * capturing if "Debug=true" is in the page URL.
 */
xcov.logging.autoInstallConsole = function() {
  goog.debug.Console.autoInstall();
  goog.asserts.assert(goog.debug.Console.instance !== null);
};


/*******************************
 * xcov.logging.installConsole *
 *******************************/


/**
 * Initializes the logging console.
 */
xcov.logging.installConsole = function() {
  xcov.logging.console_ = new goog.debug.Console();
  xcov.logging.console_.setCapturing(true);
};
