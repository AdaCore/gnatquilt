/**
 * @fileoverview Provides the top-level object to analyse and generate the HTML
 *    coverage report.
 */


goog.provide('xcov.Report');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug.Logger');
goog.require('goog.object');
goog.require('goog.string');

goog.require('xcov.Condition');
goog.require('xcov.Decision');
goog.require('xcov.Message');
goog.require('xcov.SourceFile');
goog.require('xcov.Statement');
goog.require('xcov.TraceFile');


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
   * @type {Object.<string, !xcov.SourceFile>}
   * @const
   * @private
   */
  this.sources_ = {};
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
 * @return {Array.<!xcov.SourceFile>} The list of source object read from the
 *    coverage report. Returns an empty array if the report as not been
 *    analyzed yet.
 */
xcov.Report.prototype.getSources = function() {
  return goog.object.getValues(this.sources_);
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

  goog.asserts.assert('coverage_level' in input,
      'missing "coverage_level" attribute');
  this.coverageLevel_ = input['coverage_level'];

  goog.asserts.assert('traces' in input, 'missing "traces" attribute');
  this.analyseTracesAttr_(input['traces']);

  goog.asserts.assert('sources' in input, 'missing "sources" attribute');
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
    goog.asserts.assert('filename' in trace,
        'missing "filename" attribute of trace');

    /** @const */ var filename = trace['filename'];

    goog.asserts.assert('program' in trace,
        'missing "program" attribute of trace');

    /** @const */ var program = trace['program'];

    goog.asserts.assert('date' in trace,
        'missing "date" attribute of trace');

    /** @const */ var date = new Date(trace['date']);

    goog.asserts.assert('tag' in trace,
        'missing "tag" attribute of trace');

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
    goog.asserts.assert('filename' in source,
        'missing "filename" attribute of source');

    goog.asserts.assert('coverage_level' in source,
        'missing "coverage_level" attribute of source');

    /** @const */ var sourceFile =
        new xcov.SourceFile(source['filename'], source['coverage_level']);

    goog.array.forEach(source['mappings'], function(mapping) {
      goog.asserts.assert('coverage' in mapping,
          'missing "coverage" attribute of mapping');

      goog.asserts.assert('line' in mapping,
          'missing "line" attribute of mapping');

      /** @const */ var line = mapping['line'];
      /** @const */ var lineno = line['number'];

      /** @const */ var sourceLine = new xcov.SourceLine(lineno,
          xcov.coverage.fromSymbol(mapping['coverage']), line['src']);

      goog.asserts.assert('message' in mapping,
          'missing "message" attribute of mapping');

      /** @const */ var message = mapping['message'];

      if (!goog.object.isEmpty(message)) {
        sourceFile.addMessage(lineno,
            new xcov.Message(message['kind'], message['message'],
                message['sco']));
      }

      goog.asserts.assert('statements' in mapping,
          'missing "statements" attribute of mapping');

      goog.array.forEach(mapping['statements'],
          goog.partial(xcov.Report.analyseStatement_, sourceFile));

      goog.asserts.assert('decisions' in mapping,
          'missing "decisions" attribute of mapping');

      goog.array.forEach(mapping['decisions'],
          goog.partial(xcov.Report.analyseDecision_, sourceFile));

      sourceFile.addLine(sourceLine);
    });

    goog.object.set(this.sources_, sourceFile.getFilename(), sourceFile);
  }, this /* opt_obj */);
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
  goog.asserts.assert('coverage' in statement,
      'missing "coverage" attribute of statement');

  goog.asserts.assert('id' in statement,
      'missing "id" attribute of statement');

  goog.asserts.assert('range' in statement,
      'missing "range" attribute of statement');

  goog.asserts.assert('text' in statement,
      'missing "text" attribute of statement');

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
  goog.asserts.assert('coverage' in condition,
      'missing "coverage" attribute of condition');

  goog.asserts.assert('id' in condition,
      'missing "id" attribute of condition');

  goog.asserts.assert('range' in condition,
      'missing "range" attribute of condition');

  goog.asserts.assert('text' in condition,
      'missing "text" attribute of condition');

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
  goog.asserts.assert('coverage' in decision,
      'missing "coverage" attribute of decision');

  goog.asserts.assert('id' in decision,
      'missing "id" attribute of decision');

  goog.asserts.assert('range' in decision,
      'missing "range" attribute of decision');

  goog.asserts.assert('text' in decision,
      'missing "text" attribute of decision');

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
