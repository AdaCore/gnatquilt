/**
 * @fileoverview A message attached to a source mapping.
 */


goog.provide('xcov.Message');

goog.require('goog.Disposable');
goog.require('goog.string');


/****************
 * xcov.Message *
 ****************/



/**
 * Message attached to a source mapping.
 *
 * @param {string} kind The kind of message.
 * @param {string} message The content of the message.
 * @param {?string=} opt_sco Optional SCO information.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.Message = function(kind, message, opt_sco) {
  goog.base(this);

  /**
   * @type {string}
   * @private
   */
  this.kind_ = kind;

  /**
   * @type {string}
   * @private
   */
  this.message_ = message;

  /**
   * @type {?string}
   * @private
   */
  this.sco_ = opt_sco || null;
};
goog.inherits(xcov.Message, goog.Disposable);


/************************
 * xcov.Message.getKind *
 ************************/


/**
 * @return {string} The kind of message.
 */
xcov.Message.prototype.getKind = function() {
  return this.kind_;
};


/***************************
 * xcov.Message.getMessage *
 ***************************/


/**
 * @return {string} The content of the message.
 */
xcov.Message.prototype.getMessage = function() {
  return this.message_;
};


/***********************
 * xcov.Message.getSCO *
 ***********************/


/**
 * @return {?string} The SCO associated with this message, if any, {@code null}
 *    otherwise.
 */
xcov.Message.prototype.getSCO = function() {
  return this.sco_;
};


/***********************
 * xcov.Message.hasSCO *
 ***********************/


/**
 * @return {boolean} {@code true} if SCO is not empty.
 */
xcov.Message.prototype.hasSCO = function() {
  return !goog.isNull(this.sco_);
};


/*************************
 * xcov.Message.parseSCO *
 *************************/


/**
 * @return {?{id:number,kind:string}} The SCO information: unique ID if any,
 *    {@code 0} otherwise, and target (statement, condition, ...).
 */
xcov.Message.prototype.parseSCO = function() {
  if (goog.isNull(this.sco_)) {
    return null;
  }

  /** @const */ var match = /^SCO #([0-9]+): (.*)$/.exec(this.sco_);
  /** @const */ var id = goog.string.parseInt(match[1]);
  /** @const */ var kind = match[2].toLowerCase();

  goog.asserts.assert(goog.isNumber(id), 'compiler check');
  return {id: id, kind: kind};
};
