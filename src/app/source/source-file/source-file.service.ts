import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { LoadJsonService } from '../../load-json.service';
import {
  computePercentages,
  ReportService,
  Report,
  Source,
  StatsWithEnStats,
} from '../../report.service';
import {
  ISourceAnnotated,
  IScopeMetrics,
  Mapping,
  Range,
  AnnotatedSCO,
} from '../../../interface/data.model';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { Enumerable, Enumerables } from '../../../interface/report.model';
import hljs from 'highlight.js';
import { text } from 'cheerio/lib/api/manipulation';

export class ScopeMetrics
  extends StatsWithEnStats
  implements Enumerable, Enumerables
{
  scopeLine: number;
  scopeName: string;
  children: Array<ScopeMetrics> = new Array<ScopeMetrics>();

  constructor(scopeMetrics: IScopeMetrics) {
    super(scopeMetrics.enAllStats);
    this.scopeLine = scopeMetrics.scopeLine;
    this.scopeName = scopeMetrics.scopeName;
    this.liStats = scopeMetrics.stats;
    for (const bodyMetric of scopeMetrics.children) {
      this.children.push(new ScopeMetrics(bodyMetric));
    }
    this.total = this.computeLines(this.liStats);
    this.statsPercent = computePercentages(this.total, this.liStats);
  }

  getName(): string {
    return this.scopeName;
  }

  getChildren(): Array<ScopeMetrics> {
    return this.children;
  }

  setChildren(v: Array<ScopeMetrics>): void {
    this.children = v;
  }

  computeStats(levels: Set<string>): void {
    super.computeStats(levels);
    for (const bodyMetric of this.children) {
      bodyMetric.computeStats(levels);
    }
  }

  getHeadName(): string {
    return 'Source';
  }

  getEnumerables(): Array<Enumerable> {
    return [this];
  }
}

export class AnnotatedSource extends Source implements Enumerables {
  language: string;
  // Language for the source file (can be undefined)

  scopeMetrics: ScopeMetrics;
  mappings: Mapping[];

  constructor(data: ISourceAnnotated) {
    super(data);
    this.language = data.language;
    if (data.scopeMetrics) {
      this.scopeMetrics = new ScopeMetrics(data.scopeMetrics);
    }
    this.mappings = data.mappings;
  }

  computeStats(levels: Set<string>): void {
    super.computeStats(levels);
    if (this.scopeMetrics) {
      this.scopeMetrics.computeStats(levels);
    }
  }

  getHeadName(): string {
    return 'Source';
  }

  getEnumerables(): Array<Enumerable> {
    return [this];
  }

  getScopeMetrics(): Enumerables {
    if (this.scopeMetrics) {
      return this.scopeMetrics;
    }
    return this;
  }
}

export class ScoProperties {
  kind: string;
  text: string;
  range: Range;
  annotations: string[];

  constructor(kind: string, text: string, range: Range, annotations: string[]) {
    this.kind = kind;
    this.text = text;
    this.range = range;
    this.annotations = annotations;
  }
}

/**
 * [retrieves the source coverage obligations and stores them in a map]
 *
 * @param mappings [all lines information]
 * @return [mapping of sco id to source coverage obligation properties]
 */
function computeSco(mappings: Mapping[]): Map<number, ScoProperties> {
  const result: Map<number, ScoProperties> = new Map<number, ScoProperties>();

  for (const mapping of mappings) {
    const scos: AnnotatedSCO[] = mapping.scos || [];
    for (const sco of scos) {
      result.set(
        Number(sco.id),
        new ScoProperties(sco.kind, sco.text, sco.range, sco.annotations)
      );
      if (sco.kind == 'decision') {
        for (const condition of sco.conditions) {
          result.set(
            Number(condition.id),
            new ScoProperties(
              'condition',
              condition.text,
              condition.range,
              condition.annotations
            )
          );
        }
      }
    }
  }
  return result;
}

@Injectable()
export class SourceFileService {
  sourceStats: Observable<Enumerables>;
  source$: Subject<AnnotatedSource> = new ReplaySubject<AnnotatedSource>();
  source: Observable<AnnotatedSource> = this.source$.asObservable();
  scos: Observable<Map<number, ScoProperties>>;
  projectName: ReplaySubject<string> = new ReplaySubject<string>();

  constructor(
    private route: ActivatedRoute,
    private loadJSONService: LoadJsonService,
    private reportService: ReportService
  ) {
    // We have to wait for the report to load prior to loading the source
    // file.
    reportService
      .getReport()
      .pipe(take(1))
      .subscribe((_: Report) => {
        route.paramMap
          .pipe(
            switchMap((paramMap: ParamMap) =>
              loadJSONService.getJSON(paramMap.get('sourceName'))
            )
          )
          .subscribe((data: AnnotatedSource) =>
            this.source$.next(new AnnotatedSource(data))
          );
        this.scos = this.source.pipe(
          map((source: AnnotatedSource) => computeSco(source.mappings))
        );
      });
  }

  getSource(): Observable<AnnotatedSource> {
    return this.source;
  }

  getSCOS(): Observable<Map<number, ScoProperties>> {
    return this.scos;
  }

  getSCO(scoId: number): Observable<ScoProperties> {
    return this.scos.pipe(
      map((scos: Map<number, ScoProperties>) => scos.get(scoId))
    );
  }

  computeLevelStats(levels: Set<string>): void {
    this.source.pipe(take(1)).subscribe((source: AnnotatedSource) => {
      source.computeStats(levels);
      this.source$.next(source);
    });
  }

  violationStr = new Set(['!', '-', '?']);
  hasViolation(m: Mapping) {
    return this.violationStr.has(m.coverage);
  }
}

@Injectable()
export class ExpandCollapseService {
  expandedLines: Set<string> = new Set<string>();
  collapsedLines: Set<string> = new Set<string>();

  private collapseEvent = new Subject<string>();
  private expandEvent = new Subject<string>();

  autoCollapse = true;
  constructor() {}

  expandLine(lineno: string): void {
    // user triggered expansion with click

    if (this.autoCollapse) {
      // when auto collapsing, every expanded line other than the one clicked should collapse
      for (const expandedLine of this.expandedLines) {
        this.collapseEvent.next(expandedLine);
      }
      this.expandedLines.clear();
    }
    this.expandedLines.add(lineno);
    this.collapsedLines.delete(lineno);
    this.expandEvent.next(lineno);
  }

  collapseLine(lineno: string): void {
    this.expandedLines.delete(lineno);
    this.collapsedLines.add(lineno);
    this.collapseEvent.next(lineno);
  }

  isLineExpanded(lineno: string): boolean {
    return this.expandedLines.has(lineno) && !this.collapsedLines.has(lineno);
  }

  expandEventListener(): Observable<string> {
    return this.expandEvent.asObservable();
  }

  collapseEventListener(): Observable<string> {
    return this.collapseEvent.asObservable();
  }
}

@Injectable()
export class SelectSCOService {
  private selectSCOEvent = new ReplaySubject<Range>(1);

  constructor() {}

  emitSelectSCOEvent(rng: Range) {
    this.selectSCOEvent.next(rng);
  }

  selectSCOEventListener(): Observable<Range> {
    return this.selectSCOEvent.asObservable();
  }

  inRange(lineno: number, rng: Range): boolean {
    return lineno >= rng[0][0] && lineno <= rng[1][0];
  }

  /* Turn the given string into an HTML safe span. Note that the highlight
  functions take care of sanitizing the string. */
  safe_span(str: string, lang: string, selected: boolean = false): string {
    if (lang) {
      var highlighted = hljs.highlight(str, { language: lang }).value;
    } else {
      var highlighted = hljs.highlightAuto(str, ['ada', 'c', 'cpp']).value;
    }
    return (
      '<span ' +
      (selected ? 'class="selected"' : '') +
      '>' +
      highlighted +
      '</span>'
    );
  }

  selectText(rng: Range, mapping: Mapping, lang: string) {
    const lineno = parseInt(mapping.line.lineNumber);
    const linesrc = mapping.line.src;
    const startLine = rng[0][0];
    const endLine = rng[1][0];
    // Adjust the column offset for slices
    const startColumn = rng[0][1] - 1;
    const endColumn = rng[1][1];
    var html = '';
    if (this.inRange(lineno, rng)) {
      // Check if this is beginning of the range
      if (lineno == startLine) {
        if (lineno == endLine) {
          // Three spans in that case:
          //   * Source code before the selected span
          //   * Selected span
          //   * Source code after the selected span
          html += this.safe_span(linesrc.slice(0, startColumn), lang);
          html += this.safe_span(
            linesrc.slice(startColumn, endColumn),
            lang,
            true
          );
          html += this.safe_span(linesrc.slice(endColumn), lang);
        } else {
          // Two spans in that case:
          //   * Source code before the selected span
          //   * Selected span
          html += this.safe_span(linesrc.slice(0, startColumn), lang);
          html += this.safe_span(linesrc.slice(startColumn), lang, true);
        }
      } else if (lineno == endLine) {
        // Two spans in that case:
        //   * Selected span
        //   * Source code after the selected span
        html += this.safe_span(linesrc.slice(0, endColumn), lang, true);
        html += this.safe_span(linesrc.slice(endColumn), lang);
      } else {
        // One span in that case:
        //   * Selected span
        html += this.safe_span(linesrc, lang, true);
      }
      return html;
    } else {
      return this.safe_span(mapping.line.src, lang);
    }
  }
}

@Injectable()
export class SelectLineService {
  private selectLineEvent = new ReplaySubject<string>(1);

  constructor() {}

  emitSelectLineEvent(lineno: string) {
    this.selectLineEvent.next(lineno);
  }

  selectLineEventListener(): Observable<string> {
    return this.selectLineEvent.asObservable();
  }
}

@Injectable()
export class SelectMessageService {
  private selectMessageEvent = new BehaviorSubject<[string, string]>([
    '-1',
    '-1',
  ]);

  constructor(
    private _route: ActivatedRoute,
    private _router: Router
  ) {
    // Subscribe to URL parameter changes
    this._route.queryParams.subscribe((params: Params) => {
      this.selectMessageEvent.next([params['line'], params['message']]);
    });
  }

  emitSelectMessageEvent(line: string, message: string) {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        line: line,
        message: message,
      },
      queryParamsHandling: 'merge',
      // preserve the existing query params in the route
      skipLocationChange: false,
      // do not trigger navigation
    });
  }

  selectMessageEventListener(): Observable<[string, string]> {
    return this.selectMessageEvent.asObservable();
  }
}

@Injectable()
export class SearchService {
  searchTerm = '';
  searchTermLength = 0;

  activeMatchIndex: number = -1;
  activeMatchNth: number = -1;
  activeMatch: HTMLElement = undefined;

  linesMatched: Map<number, number> = new Map();
  // Map the line number to the index of the first match of the line in
  // allMatches.

  allMatches: [number, number][];
  // List of matches in the files, mapped by the line index. A match is
  // identified by a line number + column offset.

  searchEvent: Subject<boolean> = new Subject<boolean>();
  // Event emitted each time the search is updated

  activeMatchEvent: Subject<number> = new Subject<number>();
  // Event emitted each time the active match changes

  source: ReplaySubject<AnnotatedSource> = new ReplaySubject<AnnotatedSource>();

  constructor(private sourceFileService: SourceFileService) {
    this.sourceFileService.source$
      .pipe(take(1))
      .subscribe((source: AnnotatedSource) => {
        this.source.next(source);
      });
  }

  /* Reinitialize the search context */
  reinitialize() {
    this.searchTerm = '';
    this.allMatches = [];
    this.linesMatched.clear();
    this.activeMatchIndex = -1;
    this.activeMatchNth = -1;
    this.activeMatch = undefined;
  }

  escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* Search for the given search term in the source code content:
      * Remove the results from a previous search context.
      * Look for matches in the source code (only!), and save in
        this.allMatches the search results, as a [line, column] tuples array.
      * Go to the first search result.

      Note that this does not search in the dom, but in our internal typescript
      data structures. As we use virtual scrolling, searching in the dom only
      gives partial results, and we need the exhaustive list here.
   */
  search(searchTerm) {
    // Remove the results of the previous search
    this.reinitialize();
    this.clearHighlights();
    if (!searchTerm) return;

    // Proceed with the search
    this.searchTermLength = searchTerm.length;
    this.searchTerm = this.escapeRegExp(searchTerm);
    const regex = new RegExp(this.searchTerm, 'gi');
    this.source.subscribe((source: AnnotatedSource) => {
      for (const mapping of source.mappings) {
        // Only search in the source code.
        const linenumber = parseInt(mapping.line.lineNumber);
        const srcMatches = [...mapping.line.src.matchAll(regex)];
        srcMatches.forEach((match, i) => {
          this.allMatches.push([linenumber, match.index]);
          if (!this.linesMatched.has(linenumber))
            this.linesMatched.set(linenumber, this.allMatches.length - 1);
        });
      }
      if (this.allMatches.length) {
        this.activeMatchIndex = 0;
        this.activeMatchNth = 0;
        // Trigger a re-render of lines with matches
        this.searchEvent.next(true);
        this.activeMatchEvent.next(this.allMatches[this.activeMatchIndex][0]);
      }
    });
  }

  /* Highlight the search matches in the given dom element, which is the
     HTMLElement for the given linenumber. */
  showMatchesInDom(element, linenumber) {
    // return the number of found matches

    // Exit early if the line does not contain search results
    if (!this.linesMatched.has(linenumber)) return;

    // Matches found for the given HTML element
    var elementMatches = [];

    // Explore the given HTML element and look for matches for the search term
    const regex = new RegExp(this.searchTerm, 'gi');
    const textNodes: Node[] = [];

    // Start by finding the source code line
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        // Exclude from the search selection everything that does not represent
        // the source code.
        if (
          node instanceof Element &&
          node.classList.contains('xcov-source-line-text')
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      },
    });
    var sourceCodeNode = walker.nextNode();

    walker = document.createTreeWalker(sourceCodeNode, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // Offset tracking the column number
    var totalOffset = 0;
    var rng = document.createRange();
    var currentMatchIndex = this.linesMatched.get(linenumber);

    // Start (inclusive) and end (exclusive) of the current match
    var currentMatchStart = this.allMatches[currentMatchIndex][1];
    var currentMatchEnd = currentMatchStart + this.searchTermLength;

    // Track whether we found the start of a match
    var foundStart = false;

    // Track whether we found a match
    var foundMatch = false;

    for (let node of textNodes) {
      // Check if we have a match starting here

      // Use a partialOffset to track the position in the current text node,
      // as it may contain multiple matches.
      var partialOffset = totalOffset;
      var textLength = node.textContent.length;

      // Increment the totalOffset as we may modify the node below
      totalOffset = totalOffset + node.textContent.length;
      do {
        if (partialOffset + textLength > currentMatchStart && !foundStart) {
          rng.setStart(node, currentMatchStart - partialOffset);
          foundStart = true;
        }
        if (partialOffset + textLength > currentMatchEnd - 1 && foundStart) {
          // End the range, and create a highlighted span element from all of
          // the nodes it contains.
          const matchOffsetEnd = currentMatchEnd - partialOffset;
          rng.setEnd(node, matchOffsetEnd);

          // Note: extractContents extracts (i.e. remove them from the DOM) the
          // text nodes in the range and their common ancestors.
          let frag = rng.extractContents();
          const span = document.createElement('span');
          span.className = 'search-highlight';
          span.appendChild(frag);
          rng.insertNode(span);
          node = span.nextSibling;

          // Go to the next match. If it is not on the current line, exit out.
          currentMatchIndex = currentMatchIndex + 1;
          if (
            currentMatchIndex >= this.allMatches.length ||
            this.allMatches[currentMatchIndex][0] !== linenumber
          )
            return;

          // Otherwise, there are still matches on the line: either in the
          // current text node, or in a text node that comes after.
          currentMatchStart = this.allMatches[currentMatchIndex][1];
          currentMatchEnd = currentMatchStart + this.searchTermLength;
          partialOffset = partialOffset + matchOffsetEnd;

          // Adjust the textLength
          textLength = node.textContent.length;

          // Reinitialize foundStart: we are now looking for a new match
          foundStart = false;

          // Indicate that we found a match to keep looping through this
          // text node.
          foundMatch = true;
        } else {
          // Two choices here:
          //   * We did not find the start of a match (foundStart is false)
          //   * We found the start of the match, but not the end
          //     (partialOffset + textLength < currentMathEnd).
          // In the two scenarios, we have not found a full match, so set
          // foundMatch accordingly to go to the next node.
          foundMatch = false;
        }
      } while (foundMatch);
    }
  }

  highlightNodes(element) {
    var highlightNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (
          node instanceof Element &&
          node.classList.contains('search-highlight')
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });
    while (walker.nextNode()) {
      highlightNodes.push(walker.currentNode);
    }
    return highlightNodes;
  }

  showActiveMatch(element, linenumber) {
    if (!this.linesMatched.has(linenumber)) return;
    if (this.allMatches[this.activeMatchIndex][0] !== linenumber) return;
    let highlightNodes = this.highlightNodes(element);
    highlightNodes[this.activeMatchNth].classList.add('active-match');
    if (this.activeMatch) {
      this.activeMatch.classList.remove('active-match');
    }
    this.activeMatch = highlightNodes[this.activeMatchNth];
  }

  clearHighlights() {
    // Find highlighted spans
    var highlightNodes = this.highlightNodes(document.body);

    // Remove the highlighting
    highlightNodes.forEach((node) => {
      const parent = node.parentNode;
      node.replaceWith(...node.childNodes);
      parent.normalize();
    });
  }

  // Change the active match to the next one
  nextMatch() {
    // Exit early if there are no matches
    if (!this.allMatches.length) return;

    if (this.activeMatchIndex < this.allMatches.length - 1) {
      const oldMatch = this.allMatches[this.activeMatchIndex];
      const newMatch = this.allMatches[this.activeMatchIndex + 1];
      this.activeMatchIndex = this.activeMatchIndex + 1;

      // Now, check if we switch lines. If so, we have to reset the
      // currentMatchNth to 0, otherwise we simply increment it.
      if (newMatch[0] === oldMatch[0]) {
        this.activeMatchNth = this.activeMatchNth + 1;
      } else {
        this.activeMatchNth = 0;
      }
      this.activeMatchEvent.next(newMatch[0]);
    }
  }

  // Change the active match to the previous one
  previousMatch() {
    // Exit early if there are no matches
    if (!this.allMatches.length) return;

    if (this.activeMatchIndex > 0) {
      const oldMatch = this.allMatches[this.activeMatchIndex];
      const newMatch = this.allMatches[this.activeMatchIndex - 1];
      this.activeMatchIndex = this.activeMatchIndex - 1;

      // Now, check if we switch lines. If so, we have to reset the
      // currentMatchNth to the last match of the new line, otherwise we
      /// simply decrement it.
      if (newMatch[0] === oldMatch[0]) {
        this.activeMatchNth = this.activeMatchNth - 1;
      } else {
        var tmpIndex = this.activeMatchIndex - 1;
        this.activeMatchNth = 0;
        while (tmpIndex >= 0 && this.allMatches[tmpIndex][0] === newMatch[0]) {
          this.activeMatchNth = this.activeMatchNth + 1;
          tmpIndex = tmpIndex - 1;
        }
      }
      this.activeMatchEvent.next(newMatch[0]);
    }
  }

  hasMatch(linenumber): boolean {
    return this.linesMatched.has(linenumber);
  }

  searchEventListener(): Observable<boolean> {
    return this.searchEvent.asObservable();
  }

  activeMatchEventListener(): Observable<number> {
    return this.activeMatchEvent.asObservable();
  }

  hits(): number {
    return this.allMatches.length;
  }

  activeIndex(): number {
    return this.activeMatchIndex;
  }
}
