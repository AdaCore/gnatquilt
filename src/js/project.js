/**
 * @fileoverview A project file and its associated sources.
 */


goog.provide('xcov.Project');

goog.require('goog.asserts');

goog.require('xcov.Rowable');
goog.require('xcov.SourceSet');


/****************
 * xcov.Project *
 ****************/



/**
 * A project.
 *
 * @param {string} name Name for that project.
 * @param {!xcov.SourceSet} sources Sources for that project.
 * @constructor
 * @extends {xcov.Rowable}
 */
xcov.Project = function(name, sources) {
  goog.base(this);

  /**
   * @type {string}
   * @const
   * @private
   */
  this.name_ = name;

  /**
   * @type {xcov.SourceSet}
   * @const
   * @private
   */
  this.sources_ = sources;
};
goog.inherits(xcov.Project, xcov.Rowable);


/***************************
 * xcov.Project.NO_PROJECT *
 ***************************/


/**
 * @define {string} The project name to use for the sources that are associated
 *    with no project.
 */
xcov.Project.NO_PROJECT = '_';


/************************
 * xcov.Project.getName *
 ************************/


/** @inheritDoc */
xcov.Project.prototype.getName = function() {
  return this.name_;
};


/***************************
 * xcov.Project.getSources *
 ***************************/


/**
 * @return {!xcov.SourceSet} The source files.
 */
xcov.Project.prototype.getSources = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.sources_), 'compiler check');
  return this.sources_;
};


/*****************************
 * xcov.Project.getLineCount *
 *****************************/


/** @inheritDoc */
xcov.Project.prototype.getLineCount = function(opt_status) {
  return this.sources_.getLineCount(opt_status);
};
