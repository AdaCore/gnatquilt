/**
 * @fileoverview Declares a Decision object.
 */

goog.provide('xcov.Decision');

goog.require('goog.asserts');

goog.require('xcov.AbstractSourceFragment');
goog.require('xcov.Condition');
goog.require('xcov.Range');


/*****************
 * xcov.Decision *
 *****************/



/**
 * A decision structure.
 *
 * @param {number} id Unique identification number.
 * @param {string} text Descriptive text of the decision.
 * @param {!xcov.coverage.Status} coverage The coverage state.
 * @param {!xcov.Range} range Source range.
 * @constructor
 * @extends {xcov.AbstractSourceFragment}
 */
xcov.Decision = function(id, text, coverage, range) {
  goog.base(this, id, text, coverage, range);

  /**
   * @type {Object.<string,!xcov.Condition>}
   * @private
   */
  this.conditions_ = {};
};
goog.inherits(xcov.Decision, xcov.AbstractSourceFragment);


/******************************
 * xcov.Decision.getCondition *
 ******************************/


/**
 * Returns the condition for that ID if any, {@code null} otherwise.
 *
 * @param {number|string} id The condition id.
 * @param {xcov.Condition=} opt_val The value to return if no item is found for
 *    the given key (default is undefined).
 * @return {?xcov.Condition} The line for the given number.
 */
xcov.Decision.prototype.getCondition = function(id, opt_val) {
  /** @const */ var ret =
      goog.object.get(this.conditions_, id.toString(), opt_val || null);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/**********************************
 * xcov.Decision.forEachCondition *
 **********************************/


/**
 * Calls a function for each condition of that decision. The conditions are
 * provided in the reading order.
 *
 * @param {?function(this:T,!xcov.Condition,number,?):?} f The function to
 *    call for every condition. This function takes 3 argument (the condition
 *    object, the index and the source file object). The return value is
 *    ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.Decision.prototype.forEachCondition = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.object.forEach(this.conditions_, function(condition, index) {
    callback(condition, index, this);
  }, this /* opt_obj */);
};


/******************************
 * xcov.Decision.addCondition *
 ******************************/


/**
 * Adds a new condition for this decision. Uses the unique ID to organize
 * internally the condition list. Overrides any previously provided condition
 * with the same ID.
 *
 * @param {!xcov.Condition} condition The condition to add to this decision.
 */
xcov.Decision.prototype.addCondition = function(condition) {
  goog.object.set(this.conditions_, condition.getUniqueId(), condition);
};
