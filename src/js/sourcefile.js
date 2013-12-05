/**
 * @fileoverview Encapsulates the logic for a source file.
 */


goog.provide('xcov.SourceFile');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.object');

goog.require('xcov.InstructionSet');
goog.require('xcov.Message');
goog.require('xcov.Rowable');
goog.require('xcov.SourceLine');
goog.require('xcov.Statement');
goog.require('xcov.coverage');


/*******************
 * xcov.SourceFile *
 *******************/



/**
 * Defines a source file.
 *
 * @param {string} filename The source file path.
 * @param {string} coverageLevel The coverage level for the analysis of this
 *    file.
 * @param {!Object.<xcov.coverage.Status,number>} stats The overall coverage
 *    numbers for this source file.
 * @param {?string=} opt_hunkFilename Optional hunk filename to lazily load when
 *    needed to fetch the whole source file data.
 * @param {?string=} opt_project Optional project name containing this source
 *    file.
 * @constructor
 * @extends {xcov.Rowable}
 */
xcov.SourceFile = function(filename, coverageLevel, stats, opt_hunkFilename,
    opt_project) {

  goog.base(this);

  /**
   * @type {boolean} A source file detailled information is lazily loaded. This
   *    attribute keeps track of the current state regarding to this mechanism.
   *    If {@code true}, then the full definition has already been retrieved.
   *    Otherwise, we need to load the correct hunk to gather the complete
   *    coverage information. Defaults to {@code false}.
   * @private
   */
  this.isCompletelyLoaded_ = false;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.filename_ = filename;

  /**
   * @type {string}
   * @const
   * @private
   */
  this.coverageLevel_ = coverageLevel;

  /**
   * @type {?string}
   * @const
   * @private
   */
  this.project_ = opt_project || null;

  /**
   * @type {?string}
   * @const
   * @private
   */
  this.hunkFilename_ = opt_hunkFilename || null;

  /**
   * @type {Object.<xcov.coverage.Status,number>}
   * @const
   * @private
   */
  this.stats_ = stats;

  /**
   * @type {Object.<string,!xcov.SourceLine>}
   * @const
   * @private
   */
  this.lines_ = {};

  /**
   * Internal index structure used for performance purpose.
   *
   * @type {Object.<xcov.coverage.Status,Array.<!xcov.SourceLine>>}
   * @const
   * @private
   */
  this.coverage_ = {};

  goog.object.forEach(xcov.coverage.Status, function(status) {
    goog.object.set(this.coverage_, status.symbol, []);
  }, this /* opt_obj */);

  /**
   * @type {Object.<string,!xcov.AbstractCoverageInfo>} Dictionary of
   *    coverage data/elements. Indexed by the string representation of an ID.
   * @const
   * @private
   */
  this.coverageInfo_ = {};

  /**
   * @type {Object.<string,!Array.<!xcov.Message>>}
   * @const
   * @private
   */
  this.messages_ = {};

  /**
   * @type {Object.<string,!Array.<!xcov.InstructionSet>>}
   * @const
   * @private
   */
  this.insnSets_ = {};
};
goog.inherits(xcov.SourceFile, xcov.Rowable);


/**************************************
 * xcov.SourceFile.isCompletelyLoaded *
 **************************************/


/**
 * @return {boolean} A source file detailled information can be lazily loaded.
 *    This method keeps track of the current state regarding to this mechanism.
 *    Returns {@code true} when the full definition has already been retrieved.
 *    Otherwise, returns {@code false}.
 */
xcov.SourceFile.prototype.isCompletelyLoaded = function() {
  return this.isCompletelyLoaded_;
};


/***************************************
 * xcov.SourceFile.setCompletelyLoaded *
 ***************************************/


/**
 * Sets whether the file as been fully loaded in memory or not.
 *
 * @param {boolean} completelyLoaded Whether the file has been fully loaded.
 */
xcov.SourceFile.prototype.setCompletelyLoaded = function(completelyLoaded) {
  this.isCompletelyLoaded_ = completelyLoaded;
};


/*******************************
 * xcov.SourceFile.getFilename *
 *******************************/


/**
 * @return {string} The name of the file.
 */
xcov.SourceFile.prototype.getFilename = function() {
  return goog.string.path.normalizePath(this.filename_);
};


/***************************
 * xcov.SourceFile.getName *
 ***************************/


/** @inheritDoc */
xcov.SourceFile.prototype.getName = function() {
  return this.getFilename();
};


/***********************************
 * xcov.SourceFile.getHunkFilename *
 ***********************************/


/**
 * @return {string} The filename of the hunk containing the additional coverage
 *    data, or {@code null} if this file does not exists.
 */
xcov.SourceFile.prototype.getHunkFilename = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.hunkFilename_),
      'compiler check');

  return this.hunkFilename_;
};


/************************************
 * xcov.SourceFile.getCoverageLevel *
 ************************************/


/**
 * @return {string} The level specified by the coverage report.
 */
xcov.SourceFile.prototype.getCoverageLevel = function() {
  return this.coverageLevel_;
};


/**********************************
 * xcov.SourceFile.getProjectName *
 **********************************/


/**
 * @return {?string} The name of the project containing this source file, or the
 *    empty null.
 */
xcov.SourceFile.prototype.getProjectName = function() {
  return this.project_;
};


/******************************
 * xcov.SourceFile.addMessage *
 ******************************/


/**
 * Registers the message.
 *
 * @param {number} no The line number for that message.
 * @param {!xcov.Message} message The message.
 */
xcov.SourceFile.prototype.addMessage = function(no, message) {
  /** @const */ var key = no.toString();
  /** @const */ var cell = goog.object.get(this.messages_, key, []);

  cell.push(message);
  goog.object.set(this.messages_, key, cell);
};


/******************************
 * xcov.SourceFile.hasMessage *
 ******************************/


/**
 * Whether the given line has message(s) attached.
 *
 * @param {number} no The line number.
 * @return {boolean} Whether the line is tagged with one or more messages.
 */
xcov.SourceFile.prototype.hasMessage = function(no) {
  return !goog.isNull(goog.object.get(this.messages_, no.toString(), null));
};


/**********************************
 * xcov.SourceFile.forEachMessage *
 **********************************/


/**
 * Calls a function for each message of that line.
 *
 * @param {number} no The line number.
 * @param {?function(this:T,!xcov.Message,number,?):?} f The function to
 *    call for every message. This function takes 3 argument (the message
 *    object, the index and the source file object). The return value is
 *    ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceFile.prototype.forEachMessage = function(no, f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.array.forEach(goog.object.get(this.messages_, no.toString()) || [],
      function(message, index) {
        callback(message, index, this);
      }, this /* opt_obj */);
};


/*************************************
 * xcov.SourceFile.addInstructionSet *
 *************************************/


/**
 * Registers the instruction set.
 *
 * @param {number} no The line number for that message.
 * @param {!xcov.InstructionSet} insnSet The set.
 */
xcov.SourceFile.prototype.addInstructionSet = function(no, insnSet) {
  /** @const */ var key = no.toString();
  /** @const */ var cell = goog.object.get(this.insnSets_, key, []);

  cell.push(insnSet);
  goog.object.set(this.insnSets_, key, cell);
};


/*************************************
 * xcov.SourceFile.hasInstructionSet *
 *************************************/


/**
 * Whether the given line has message(s) attached.
 *
 * @param {number} no The line number.
 * @return {boolean} Whether the line is tagged with one or more sets.
 */
xcov.SourceFile.prototype.hasInstructionSet = function(no) {
  return !goog.isNull(goog.object.get(this.insnSets_, no.toString(), null));
};


/*****************************************
 * xcov.SourceFile.forEachInstructionSet *
 *****************************************/


/**
 * Calls a function for each instruction set of that line.
 *
 * @param {number} no The line number.
 * @param {?function(this:T,!xcov.InstructionSet,number,?):?} f The function to
 *    call for every set. This function takes 3 argument (the instruction set
 *    object, the index and the source file object). The return value is
 *    ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceFile.prototype.forEachInstructionSet = function(no, f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.array.forEach(goog.object.get(this.insnSets_, no.toString()) || [],
      function(insnSet, index) {
        callback(insnSet, index, this);
      }, this /* opt_obj */);
};


/**********************************
 * xcov.SourceFile.hasAttachement *
 **********************************/


/**
 * Whether this line has an attachement or not.
 *
 * @param {number} lineno The line number.
 * @return {boolean} True if this line has an attachement.
 */
xcov.SourceFile.prototype.hasAttachement = function(lineno) {
  return this.hasMessage(lineno) || this.hasInstructionSet(lineno);
};


/********************************
 * xcov.SourceFile.containsLine *
 ********************************/


/**
 * Returns {@code true} if the file as a line at that line number.
 *
 * @param {number} no The line number.
 * @return {boolean} Whether the file contains a line with the given number.
 */
xcov.SourceFile.prototype.containsLine = function(no) {
  return goog.object.containsKey(this.lines_, no.toString());
};


/***************************
 * xcov.SourceFile.getLine *
 ***************************/


/**
 * Returns the line for that line number if any, {@code null} otherwise.
 *
 * @param {number} no The line number.
 * @param {xcov.SourceLine=} opt_val The value to return if no item is found for
 *    the given key (default is undefined).
 * @return {?xcov.SourceLine} The line for the given number.
 */
xcov.SourceFile.prototype.getLineAt = function(no, opt_val) {
  /** @const */ var ret =
      goog.object.get(this.lines_, no.toString(), opt_val || null);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/*******************************
 * xcov.SourceFile.forEachLine *
 *******************************/


/**
 * Calls a function for each line in the file. The lines are provided in the
 * correct (increasing) order.
 *
 * @param {?function(this:T,xcov.SourceLine,number,?):?} f The function to
 *    call for every line. This function takes 3 argument (the line object, the
 *    index and the source file object). The return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceFile.prototype.forEachLine = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.object.forEach(this.lines_, function(line, index) {
    callback(line, index, this);
  }, this /* opt_obj */);
};


/***************************
 * xcov.SourceFile.addLine *
 ***************************/


/**
 * Adds a new line for this source file. Uses the line number to organize
 * internally the line list. Overrides any previously provided line with the
 * same line number.
 *
 * @param {!xcov.SourceLine} line The source line to add to this file.
 */
xcov.SourceFile.prototype.addLine = function(line) {
  goog.object.add(this.lines_, line.getNumber().toString(), line);
  goog.object.get(this.coverage_, line.getCoverage().symbol, null).push(line);
};


/********************************
 * xcov.SourceFile.getLineCount *
 ********************************/


/** @inheritDoc */
xcov.SourceFile.prototype.getLineCount = function(opt_coverageStatus) {
  if (!goog.isDef(opt_coverageStatus)) {
    // Return only the lines that are not tagged as NO_CODE

    /** @const */ var total = goog.array.reduce(
        goog.object.getValues(this.stats_), function(count, curr) {
          return count + curr;
        }, 0, this /* opt_obj */);

    return total - this.getLineCount(xcov.coverage.Status.NO_CODE);
  }

  return /** @type {number} */ (
      goog.object.get(this.stats_, opt_coverageStatus.internalImage, 0));
};


/***********************************
 * xcov.SourceFile.getCoverageInfo *
 ***********************************/


/**
 * Returns the source fragment (either statement or decision) for that ID,
 * {@code null} otherwise.
 *
 * @param {number|string} id The statement id.
 * @param {xcov.AbstractCoverageInfo=} opt_val The value to return if no item
 *    is found for the given key (default is undefined).
 * @return {?xcov.AbstractCoverageInfo} The line for the given number.
 */
xcov.SourceFile.prototype.getCoverageInfo = function(id, opt_val) {
  /** @const */ var ret = goog.object.get(this.coverageInfo_,
      id.toString(), opt_val || null);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/***************************************
 * xcov.SourceFile.forEachCoverageInfo *
 ***************************************/


/**
 * Calls a function for each statement in the file. The statements are provided
 * in the correct (increasing) order.
 *
 * @param {?function(this:T,xcov.AbstractCoverageInfo,number,?):?} f The
 *    function to call for every info element. This function takes 3 argument
 *    (the coverage info  object, the index and the source file object). The
 *    return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.SourceFile.prototype.forEachCoverageInfo = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.object.forEach(this.coverageInfo_, function(info, index) {
    callback(info, index, this);
  }, this /* opt_obj */);
};


/***********************************
 * xcov.SourceFile.addCoverageInfo *
 ***********************************/


/**
 * Adds a new coverage info object (either a statement, a decision or a
 * condition) for this source file. Uses the unique ID to organize internally
 * the internal list. Overrides any previously provided element with the same
 * ID.
 *
 * @param {!xcov.AbstractCoverageInfo} info The info element to add to this
 *    file.
 */
xcov.SourceFile.prototype.addCoverageInfo = function(info) {
  goog.object.set(this.coverageInfo_, info.getUniqueId(), info);
};
