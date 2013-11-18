/**
 * @fileoverview A simple instruction set.
 */


goog.provide('xcov.InstructionSet');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');

goog.require('xcov.InstructionBlock');


/***********************
 * xcov.InstructionSet *
 ***********************/



/**
 * An instruction set, containing instruction blocks.
 *
 * @param {xcov.coverage.Status} coverage Coverage value for this line.
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.InstructionSet = function(coverage) {
  goog.base(this);

  /**
   * @type {xcov.coverage.Status}
   * @const
   * @private
   */
  this.coverage_ = coverage;

  /**
   * @type {Array.<!xcov.InstructionBlock>} List of instruction blocks.
   * @const
   * @private
   */
  this.insnBlocks_ = [];
};
goog.inherits(xcov.InstructionSet, goog.Disposable);


/***********************************
 * xcov.InstructionSet.getCoverage *
 ***********************************/


/**
 * @return {xcov.coverage.Status} The coverage status for this instruction.
 */
xcov.InstructionSet.prototype.getCoverage = function() {
  return this.coverage_;
};


/*******************************************
 * xcov.InstructionSet.addInstructionBlock *
 *******************************************/


/**
 * Appends an instruction block to the list.
 *
 * @param {!xcov.InstructionBlock} insnBlock The instruction block to add.
 */
xcov.InstructionSet.prototype.addInstructionBlock = function(insnBlock) {
  this.insnBlocks_.push(insnBlock);
};


/***********************************************
 * xcov.InstructionSet.forEachInstructionBlock *
 ***********************************************/


/**
 * Calls a function for each instruction block of that set.
 *
 * @param {?function(this:T,!xcov.InstructionBlock,number,?):?} f The function
 *    to call for every instruction block. This function takes 3 argument (the
 *    instruction block object, the index and the instruction set object). The
 *    return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.InstructionSet.prototype.forEachInstructionBlock = function(f, opt_obj) {
  goog.array.forEach(this.insnBlocks_, f, opt_obj);
};
