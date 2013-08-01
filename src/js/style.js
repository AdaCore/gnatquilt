/**
 * @fileoverview Declares constants.
 */


goog.provide('xcov.style');


/************************
 * xcov.style.CSS_CLASS *
 ************************/


/**
 * @type {string} Namespace for all CSS classes.
 * @const
 */
xcov.style.CSS_CLASS = goog.getCssName('xcov');


/*********************************
 * xcov.style.ROW_EVEN_CSS_CLASS *
 *********************************/


/**
 * @type {string} CSS class for even rows in a table.
 * @const
 */
xcov.style.ROW_EVEN_CSS_CLASS =
    goog.getCssName(xcov.style.CSS_CLASS, 'table-row-even');


/********************************
 * xcov.style.ROW_ODD_CSS_CLASS *
 ********************************/


/**
 * @type {string} CSS class for odd rows in a table.
 * @const
 */
xcov.style.ROW_ODD_CSS_CLASS =
    goog.getCssName(xcov.style.CSS_CLASS, 'table-row-odd');
