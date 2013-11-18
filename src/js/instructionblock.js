/**
 * @fileoverview A simple instruction block.
 */


goog.provide('xcov.InstructionBlock');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');

goog.require('xcov.Instruction');


/********************
 * xcov.Instruction *
 ********************/



/**
 * An instruction block, refering to a native symbol.
 *
 * @param {xcov.coverage.Status} coverage Coverage value for this line.
 * @param {string} name The name of the symbol to which the instructions refer.
 * @param {string} offset The offset of the block, in hexadecimal string
 *    representation.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.InstructionBlock = function(coverage, name, offset) {
  goog.base(this);

  /**
   * @type {xcov.coverage.Status}
   * @const
   * @private
   */
  this.coverage_ = coverage;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.name_ = name;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.offset_ = offset;

  /**
   * @type {Array.<!xcov.Instruction>} List of instructions.
   * @const
   * @private
   */
  this.insns_ = [];
};
goog.inherits(xcov.InstructionBlock, goog.Disposable);


/*************************************
 * xcov.InstructionBlock.getCoverage *
 *************************************/


/**
 * @return {xcov.coverage.Status} The coverage status for this instruction.
 */
xcov.InstructionBlock.prototype.getCoverage = function() {
  return this.coverage_;
};


/***************************************
 * xcov.InstructionBlock.getSymbolName *
 ***************************************/


/**
 * @return {string} The name of the symbol.
 */
xcov.InstructionBlock.prototype.getSymbolName = function() {
  return this.name_;
};


/***********************************
 * xcov.InstructionBlock.getOffset *
 ***********************************/


/**
 * @return {string} The string representation of the offset of this block.
 */
xcov.InstructionBlock.prototype.getOffset = function() {
  return this.offset_;
};


/****************************************
 * xcov.InstructionBlock.addInstruction *
 ****************************************/


/**
 * Appends an instruction to the list of instructions.
 *
 * @param {!xcov.Instruction} insn The instruction to add.
 */
xcov.InstructionBlock.prototype.addInstruction = function(insn) {
  this.insns_.push(insn);
};


/********************************************
 * xcov.InstructionBlock.forEachInstruction *
 ********************************************/


/**
 * Calls a function for each instruction of that block.
 *
 * @param {?function(this:T,!xcov.Instruction,number,?):?} f The function to
 *    call for every instruction. This function takes 3 argument (the
 *    instruction object, the index and the instruction block object). The
 *    return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.InstructionBlock.prototype.forEachInstruction = function(f, opt_obj) {
  goog.array.forEach(this.insns_, f, opt_obj);
};
