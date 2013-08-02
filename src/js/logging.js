/**
 * @fileoverview Handle the initialization of the logging engine. Explicitly
 *    install a logging console in non-compiled (development) mode. In
 *    compiled-mode, automatically initialize itself if '?Debug=true' is present
 *    in the web page URL.
 */


goog.provide('xcov.logging');
goog.provide('xcov.logging.TextFormatter');

goog.require('goog.debug');
goog.require('goog.debug.Console');
goog.require('goog.debug.LogManager');
goog.require('goog.debug.Logger.Level');
goog.require('goog.debug.TextFormatter');


/***********************************
 * goog.debug.Console.setFormatter *
 ***********************************/


/**
 * Sets the formatter instance.
 *
 * @param {!goog.debug.TextFormatter} formatter Formatter for formatted output.
 */
goog.debug.Console.prototype.setFormatter = function(formatter) {
  this.formatter_ = formatter;
};


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
  goog.debug.Console.instance.setFormatter(new xcov.logging.TextFormatter());
};


/*******************************
 * xcov.logging.installConsole *
 *******************************/


/**
 * Initializes the logging console.
 */
xcov.logging.installConsole = function() {
  xcov.logging.console_ = new goog.debug.Console();
  xcov.logging.console_.setFormatter(new xcov.logging.TextFormatter());
  xcov.logging.console_.setCapturing(true);
};


/******************************
 * xcov.logging.TextFormatter *
 ******************************/



/**
 * Custom text formatter.
 *
 * @constructor
 * @extends {goog.debug.TextFormatter}
 */
xcov.logging.TextFormatter = function() {
  goog.base(this, undefined /* opt_prefix */);
};
goog.inherits(xcov.logging.TextFormatter, goog.debug.TextFormatter);


/*******************************************
 * xcov.logging.TextFormatter.formatRecord *
 *******************************************/


/** @inheritDoc */
xcov.logging.TextFormatter.prototype.formatRecord = function(logRecord) {
  // Build message html
  var sb = [];

  if (this.showLoggerName) {
    sb.push('[', logRecord.getLoggerName(), '] ');
  }

  if (this.showSeverityLevel) {
    sb.push('[', logRecord.getLevel().name, '] ');
  }

  sb.push(logRecord.getMessage());

  if (this.showExceptionText && logRecord.getException()) {
    sb.push('\n', logRecord.getExceptionText());
  }

  return sb.join('');
};
