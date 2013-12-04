/**
 * @fileoverview Provides the top-level object to analyse and generate the HTML
 *    coverage report.
 */


goog.provide('xcov.Report');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.string');

goog.require('xcov.Condition');
goog.require('xcov.Decision');
goog.require('xcov.Instruction');
goog.require('xcov.InstructionBlock');
goog.require('xcov.InstructionSet');
goog.require('xcov.Message');
goog.require('xcov.SourceFile');
goog.require('xcov.SourceSet');
goog.require('xcov.Statement');
goog.require('xcov.TraceFile');
goog.require('xcov.asserts');


/***************
 * xcov.Report *
 ***************/



/**
 * A coverage report object. It is capable of analyzing a JSON coverage report.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
xcov.Report = function() {
  goog.base(this);

  /**
   * @type {goog.debug.Logger} An custom instance of the logger for this class.
   * @const
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('xcov.Report');

  /**
   * @type {?string} Coverage level for this report.
   * @private
   */
  this.coverageLevel_ = null;

  /**
   * @type {Array.<!xcov.TraceFile>}
   * @const
   * @private
   */
  this.traces_ = [];

  /**
   * @type {Object.<string,!xcov.SourceFile>}
   * @const
   * @private
   */
  this.sources_ = {};

  /**
   * @type {Object.<string,!xcov.SourceSet>} Organizes the sources by
   *    projects for lookup efficiency.
   * @const
   * @private
   */
  this.projects_ = {};

  /**
   * @type {xcov.SourceSet} Source files not related to any project.
   * @const
   * @private
   */
  this.noProjectSources_ = new xcov.SourceSet();
};
goog.inherits(xcov.Report, goog.Disposable);


/********************************
 * xcov.Report.getCoverageLevel *
 ********************************/


/**
 * @return {string} The level specified by the coverage report. Returns an empty
 *    string if the report as not been previously analysed.
 */
xcov.Report.prototype.getCoverageLevel = function() {
  return this.coverageLevel_ || '';
};


/*************************
 * xcov.Report.getTraces *
 *************************/


/**
 * @return {Array.<!xcov.TraceFile>} The list of trace object read from the
 *    coverage report. Returns an empty array if the report as not been
 *    analized yet.
 */
xcov.Report.prototype.getTraces = function() {
  return this.traces_;
};


/**************************
 * xcov.Report.getSources *
 **************************/


/**
 * Returns a source set containing the list of source files, optionally filtered
 * by project.
 *
 * @param {?string=} opt_project If specified, returns the list of sources for
 *    that project. If {@code null}, returns the set of source files that
 *    belongs to no project.
 * @return {!xcov.SourceSet} The list of source object read from the
 *    coverage report. Returns an empty set if the report as not been
 *    analyzed yet or if the project does not exist.
 */
xcov.Report.prototype.getSources = function(opt_project) {
  /** @type {xcov.SourceSet} */ var list = null;

  if (!goog.isDef(opt_project)) {
    list = new xcov.SourceSet(goog.object.getValues(this.sources_));

  } else if (goog.isNull(opt_project)) {
    list = this.noProjectSources_;

  } else {
    list = /** @type {!xcov.SourceSet} */ (
        goog.object.get(this.projects_, opt_project, null) ||
        new xcov.SourceSet());
  }

  goog.asserts.assert(goog.isDefAndNotNull(list), 'compiler check');
  return list;
};


/*************************
 * xcov.Report.getSource *
 *************************/


/**
 * Returns the source object corresponding to the given filename.
 *
 * @param {string} filename The source filename.
 * @return {?xcov.SourceFile} The source object if exists, {@code null}
 *    otherwise.
 */
xcov.Report.prototype.getSource = function(filename) {
  /** @const */ var ret =
      goog.object.get(this.sources_, filename, null /* opt_val */);

  goog.asserts.assert(goog.isDef(ret), 'compiler check');
  return ret;
};


/******************************
 * xcov.Report.forEachProject *
 ******************************/


/**
 * Calls a function for each project.
 *
 * @param {function(this:T,?string,!xcov.SourceSet):?} f The function
 *    to call for every project. The function takes 2 arguments (the name of the
 *    project and the list of sources associated with it). Sources with no
 *    associated project are also listed, using {@code null} as project name.
 *    The return value is ignored.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
xcov.Report.prototype.forEachProject = function(f, opt_obj) {
  /** @const */ var callback = goog.bind(f, opt_obj);

  goog.object.forEach(this.projects_, function(sources, project) {
    callback(project, sources);
  }, this /* opt_obj */);

  goog.asserts.assert(goog.isDefAndNotNull(this.noProjectSources_),
      'compiler check');

  if (!this.noProjectSources_.isEmpty()) {
    callback(null, this.noProjectSources_);
  }
};


/************************
 * xcov.Report.loadHunk *
 ************************/


/**
 * Loads and analyses the hunk to lazily retrieve coverage information about a
 * source file.
 *
 * @param {Object} hunk The JSON hunk to load.
 * @return {?xcov.SourceFile} The source filename corresponding to this hunk.
 *    Returns {@code null} on error.
 */
xcov.Report.prototype.loadHunk = function(hunk) {
  xcov.asserts.ensureAttribute('filename', hunk, 'hunk');

  /** @const */ var filename = hunk['filename'];
  /** @const */ var sourceFile = goog.object.get(this.sources_, filename, null);

  if (goog.isNull(sourceFile)) {
    this.logger_.severe('attempting to load a hunk for an unknown source file');
    return null;
  }

  goog.asserts.assert(goog.isDef(sourceFile), 'compiler check');
  this.analyseSource_(hunk, sourceFile);

  this.logger_.info('Hunk loaded: ' + filename);
  return sourceFile;
};


/***********************
 * xcov.Report.analyse *
 ***********************/


/**
 * Analyzes the input JSON report and generate the HTML report accordingly.
 *
 * @param {Object} input The JSON report to analyse. Do nothing if {@code null}
 *    or {@code undefined}.
 * @return {boolean} {@code true} upon successful analysis, {@code false}
 *    otherwise.
 */
xcov.Report.prototype.analyze = function(input) {
  if (!goog.isDefAndNotNull(input)) {
    this.logger_.severe('Nothing to analyze. Aborting...');
    return false;
  }

  xcov.asserts.ensureAttribute('coverage_level', input, 'root');
  this.coverageLevel_ = input['coverage_level'];

  xcov.asserts.ensureAttribute('traces', input, 'root');
  this.analyseTracesAttr_(input['traces']);

  xcov.asserts.ensureAttribute('sources', input, 'root');
  this.analyseSourcesAttr_(input['sources']);

  return true;
};


/**********************************
 * xcov.Report.analyseTracesAttr_ *
 **********************************/


/**
 * Subroutine that handles the 'traces' field from the JSON report.
 *
 * @param {Array.<!Object>} traces The JSON value for the 'traces' attribute of
 *    the JSON report.
 * @private
 */
xcov.Report.prototype.analyseTracesAttr_ = function(traces) {
  goog.array.forEach(traces, function(trace) {
    xcov.asserts.ensureAttribute('filename', trace, 'trace');

    /** @const */ var filename = trace['filename'];

    xcov.asserts.ensureAttribute('program', trace, 'trace');

    /** @const */ var program = trace['program'];

    xcov.asserts.ensureAttribute('date', trace, 'trace');

    /** @const */ var date = new Date(trace['date']);

    xcov.asserts.ensureAttribute('tag', trace, 'trace');

    /** @const */ var tag = trace['tag'];

    this.traces_.push(new xcov.TraceFile(filename, program, date, tag));
  }, this /* opt_obj */);
};


/***********************************
 * xcov.Report.analyseSourcesAttr_ *
 ***********************************/


/**
 * Subroutine that handles the 'sources' field from the JSON report.
 *
 * @param {Array.<!Object>} sources The JSON value for the 'sourcces' attribute
 *    of the JSON report.
 * @private
 */
xcov.Report.prototype.analyseSourcesAttr_ = function(sources) {
  goog.array.forEach(sources, function(source) {

    xcov.asserts.ensureAttribute('filename', source, 'source');
    xcov.asserts.ensureAttribute('hunk_filename', source, 'source');
    xcov.asserts.ensureAttribute('coverage_level', source, 'source');
    xcov.asserts.ensureAttribute('stats', source, 'source');

    /** @const */ var project = 'project' in source ? source['project'] : null;

    /** @const */ var sourceFile =
        new xcov.SourceFile(source['filename'], source['coverage_level'],
            xcov.Report.analyseStats_(source['stats']), source['hunk_filename'],
            project);

    goog.object.set(this.sources_, sourceFile.getFilename(), sourceFile);

    if (goog.string.isEmptySafe(project)) {
      this.noProjectSources_.push(sourceFile);

    } else {
      /** @const */ var sources =
          goog.object.get(this.projects_, project, null) ||
          new xcov.SourceSet();

      sources.push(sourceFile);
      goog.object.set(this.projects_, project, sources);
    }
  }, this /* opt_obj */);
};


/******************************
 * xcov.Report.analyseSource_ *
 ******************************/


/**
 * Analyses a full source definition (as contained by a hunk file).
 * Loads the additional data gathered within the given {@code xcov.SourceFile}.
 *
 * @param {Object} source The JSON hunk for a source definition.
 * @param {!xcov.SourceFile} sourceFile The source file to complete with the
 *    additional data from the JSON object {@code source}.
 * @private
 */
xcov.Report.prototype.analyseSource_ = function(source, sourceFile) {
  goog.array.forEach(source['mappings'], function(mapping) {
    xcov.asserts.ensureAttribute('coverage', mapping, 'mapping');
    xcov.asserts.ensureAttribute('line', mapping, 'mapping');

    /** @const */ var line = mapping['line'];

    xcov.asserts.ensureAttribute('number', line, 'line');

    /** @const */ var lineno = line['number'];

    /** @const */ var sourceLine = new xcov.SourceLine(lineno,
        xcov.coverage.fromSymbol(mapping['coverage']), line['src']);

    if ('message' in mapping) {
      /** @const */ var message = mapping['message'];

      if (!goog.object.isEmpty(message)) {
        sourceFile.addMessage(lineno,
            new xcov.Message(message['kind'], message['message'],
                message['sco']));
      }
    }

    if ('statements' in mapping) {
      goog.array.forEach(mapping['statements'],
          goog.partial(xcov.Report.analyseStatement_, sourceFile));
    }

    if ('decisions' in mapping) {
      goog.array.forEach(mapping['decisions'],
          goog.partial(xcov.Report.analyseDecision_, sourceFile));
    }

    if ('instruction_set' in mapping) {
      xcov.Report.analyseInstructionSet_(sourceFile, lineno,
          mapping['instruction_set']);
    }

    sourceFile.addLine(sourceLine);
  });

  // The source file definition is now complete. Mark it as such.
  sourceFile.setCompletelyLoaded(true);
};


/*****************************
 * xcov.Report.analyseStats_ *
 *****************************/


/**
 * Parses the input stats.
 *
 * @param {Object} stats The stats to analyse.
 * @return {!Object.<xcov.coverage.Status,number>} A stats array.
 * @private
 */
xcov.Report.analyseStats_ = function(stats) {
  /** @const */ var ret = {};

  goog.object.forEach(xcov.coverage.Status, function(status) {
    xcov.asserts.ensureAttribute(status.internalImage, stats, 'stats');
    goog.object.set(ret, status.internalImage, stats[status.internalImage]);
  });

  return ret;
};


/*********************************
 * xcov.Report.analyseStatement_ *
 *********************************/


/**
 * Retrieves data from a statement JSON object.
 *
 * @param {!xcov.SourceFile} sourceFile The annotated source file.
 * @param {!Object} statement JSON representation of a statement.
 * @private
 */
xcov.Report.analyseStatement_ = function(sourceFile, statement) {
  xcov.asserts.ensureAttribute('coverage', statement, 'statement');
  xcov.asserts.ensureAttribute('id', statement, 'statement');
  xcov.asserts.ensureAttribute('range', statement, 'statement');
  xcov.asserts.ensureAttribute('text', statement, 'statement');

  /** @const */ var range = statement['range'];

  /** @const */ var s = new xcov.Statement(
      statement['id'], statement['text'],
      xcov.coverage.fromSymbol(statement['coverage']),
      new xcov.Range(
          new xcov.SLOC(range[0][0], range[0][1]),
          new xcov.SLOC(range[1][0], range[1][1])));

  sourceFile.addCoverageInfo(s);
};


/*********************************
 * xcov.Report.analyseCondition_ *
 *********************************/


/**
 * Retrieves data from a condition JSON object.
 *
 * @param {!xcov.Decision} decision The decision object.
 * @param {!Object} condition JSON representation of a condition.
 * @private
 */
xcov.Report.analyseCondition_ = function(decision, condition) {
  xcov.asserts.ensureAttribute('coverage', condition, 'condition');
  xcov.asserts.ensureAttribute('id', condition, 'condition');
  xcov.asserts.ensureAttribute('range', condition, 'condition');
  xcov.asserts.ensureAttribute('text', condition, 'condition');

  /** @const */ var range = condition['range'];

  /** @const */ var c = new xcov.Condition(
      condition['id'], condition['text'],
      xcov.coverage.fromSymbol(condition['coverage']),
      new xcov.Range(
          new xcov.SLOC(range[0][0], range[0][1]),
          new xcov.SLOC(range[1][0], range[1][1])));

  decision.addCondition(c);
};


/********************************
 * xcov.Report.analyseDecision_ *
 ********************************/


/**
 * Retrieves data from a decision JSON object.
 *
 * @param {!xcov.SourceFile} sourceFile The annotated source file.
 * @param {!Object} decision JSON representation of a decision.
 * @private
 */
xcov.Report.analyseDecision_ = function(sourceFile, decision) {
  xcov.asserts.ensureAttribute('coverage', decision, 'decision');
  xcov.asserts.ensureAttribute('id', decision, 'decision');
  xcov.asserts.ensureAttribute('range', decision, 'decision');
  xcov.asserts.ensureAttribute('text', decision, 'decision');

  /** @const */ var range = decision['range'];

  /** @const */ var d = new xcov.Decision(
      decision['id'], decision['text'],
      xcov.coverage.fromSymbol(decision['coverage']),
      new xcov.Range(
          new xcov.SLOC(range[0][0], range[0][1]),
          new xcov.SLOC(range[1][0], range[1][1])));

  goog.array.forEach(decision['conditions'],
      goog.partial(xcov.Report.analyseCondition_, d));

  d.forEachCondition(sourceFile.addCoverageInfo, sourceFile);
  sourceFile.addCoverageInfo(d);
};


/****************************************
 * xcov.Report.analyseInstructionBlock_ *
 ****************************************/


/**
 * Retrieves data from an instruction_block JSON object.
 *
 * @param {!xcov.InstructionSet} insnSet The instruction set.
 * @param {!Object} insnBlock JSON representation of an instruction_block.
 * @private
 */
xcov.Report.analyseInstructionBlock_ = function(insnSet, insnBlock) {
  xcov.asserts.ensureAttribute('coverage', insnBlock, 'insnBlock');
  xcov.asserts.ensureAttribute('name', insnBlock, 'insnBlock');
  xcov.asserts.ensureAttribute('offset', insnBlock, 'insnBlock');
  xcov.asserts.ensureAttribute('instructions', insnBlock, 'insnBlock');

  /** @const */ var block = new xcov.InstructionBlock(
      xcov.coverage.fromSymbol(insnBlock['coverage']), insnBlock['name'],
      insnBlock['offset']);

  goog.array.forEach(insnBlock['instructions'], function(insn) {
    xcov.asserts.ensureAttribute('address', insn, 'insn');
    xcov.asserts.ensureAttribute('assembly', insn, 'insn');
    xcov.asserts.ensureAttribute('coverage', insn, 'insn');

    /*
     * NOTE: The coverage field of an instruction can contain 2 other symbols:
     *   - ">" for "branch executed"
     *   - "v" for "branch never executed"
     * For the moment, we simply store the character for future display. At some
     * point we will want to have a finer grain parsing and branch-specific
     * symbols table.

    /** @const */ var instruction = new xcov.Instruction(
        insn['coverage'], insn['address'], insn['assembly']);

    block.addInstruction(instruction);
  });

  insnSet.addInstructionBlock(block);
};


/**************************************
 * xcov.Report.analyseInstructionSet_ *
 **************************************/


/**
 * Retrieves data from an instruction_set JSON object.
 *
 * @param {!xcov.SourceFile} sourceFile The annotated source file.
 * @param {number} lineno The line number associated with this instruction set.
 * @param {!Object} insnSet JSON representation of an instruction_set.
 * @private
 */
xcov.Report.analyseInstructionSet_ = function(sourceFile, lineno, insnSet) {
  xcov.asserts.ensureAttribute('coverage', insnSet, 'insnSet');
  xcov.asserts.ensureAttribute('instruction_blocks', insnSet, 'insnSet');

  /** @const */ var set = new xcov.InstructionSet(
      xcov.coverage.fromSymbol(insnSet['coverage']));

  goog.array.forEach(insnSet['instruction_blocks'], function(insnBlock) {
    xcov.Report.analyseInstructionBlock_(set, insnBlock);
  });

  sourceFile.addInstructionSet(lineno, set);
};
