/**
 * @fileoverview A simple instruction object.
 */


goog.provide('xcov.Instruction');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');


/********************
 * xcov.Instruction *
 ********************/



/**
 * An instruction object.
 *
 * @param {string} coverageSymbol Coverage symbol for this instruction.
 * @param {string} address The address of the instruction, in hexadecimal string
 *    representation.
 * @param {string} assembly The ASM code for that instruction.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.Instruction = function(coverageSymbol, address, assembly) {
  goog.base(this);

  /**
   * @type {string}
   * @const
   * @private
   */
  this.coverage_ = coverageSymbol;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.address_ = address;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.assembly_ = assembly;
};
goog.inherits(xcov.Instruction, goog.Disposable);


/********************************
 * xcov.Instruction.getCoverage *
 ********************************/


/**
 * @return {string} The coverage status for this instruction (string
 *    representation).
 */
xcov.Instruction.prototype.getCoverage = function() {
  return this.coverage_;
};


/*******************************
 * xcov.Instruction.getAddress *
 *******************************/


/**
 * @return {string} The string representation of the address of this
 *    instruction.
 */
xcov.Instruction.prototype.getAddress = function() {
  return this.address_;
};


/********************************
 * xcov.Instruction.getAssembly *
 ********************************/


/**
 * @return {string} The assembly code for this instruction.
 */
xcov.Instruction.prototype.getAssembly = function() {
  return this.assembly_;
};
