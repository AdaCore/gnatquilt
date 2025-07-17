import { Injectable } from '@angular/core';
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
