import { EventEmitter, Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { LoadJsonService } from '../../load-json.service';
import {
  computePercentages,
  ReportService,
  Source,
  StatsWithEnStats,
} from '../../report.service';
import {
  AnnotatedSCO,
  Decision,
  EntityStats,
  ISource,
  ISourceAnnotated,
  IScopeMetrics,
  Mapping,
  Range,
  Statement,
} from '../../../interface/data.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { Enumerable, Enumerables } from '../../../interface/report.model';
import { SourceLineComponent } from '../source-line/source-line.component';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

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
  scopeMetrics: ScopeMetrics;
  mappings: Mapping[];

  constructor(data: ISourceAnnotated) {
    super(data);
    this.scopeMetrics = new ScopeMetrics(data.scopeMetrics);
    this.mappings = data.mappings;
  }

  computeStats(levels: Set<string>): void {
    super.computeStats(levels);
    this.scopeMetrics.computeStats(levels);
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
  const scos: Map<number, ScoProperties> = new Map<number, ScoProperties>();

  for (const mapping of mappings) {
    const statements: Statement[] = mapping.statements || [];
    for (const statement of statements) {
      scos.set(
        Number(statement.id),
        new ScoProperties(
          'statement',
          statement.text,
          statement.range,
          statement.annotations
        )
      );
    }

    const decisions: Decision[] = mapping.decisions || [];
    for (const decision of decisions) {
      scos.set(
        Number(decision.id),
        new ScoProperties(
          'decision',
          decision.text,
          decision.range,
          decision.annotations
        )
      );
      if (decision.conditions) {
        for (const condition of decision.conditions) {
          scos.set(
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
  return scos;
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
    route.paramMap
      .pipe(take(1))
      .pipe(
        switchMap((paramMap: ParamMap) =>
          loadJSONService.getJSON(paramMap.get('sourceName'))
        )
      )
      .pipe(map((data: ISourceAnnotated) => new AnnotatedSource(data)))
      .subscribe((source: AnnotatedSource) => this.source$.next(source));
    this.scos = this.source.pipe(
      map((source: AnnotatedSource) => computeSco(source.mappings))
    );
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
}

@Injectable()
export class ExpandCollapseService {
  expandedLines: Set<string> = new Set<string>();
  collapsedLines: Set<string> = new Set<string>();

  autoCollapse = true;
  constructor() {}

  expandedLine(
    expandedLine: SourceLineComponent,
    scroller: VirtualScrollerComponent
  ): void {
    // user triggered expansion with click
    if (this.autoCollapse) {
      // when auto collapsing, every expanded line other than the one clicked should collapse
      this.expandedLines.clear();
    }
    const lineno: string = expandedLine.getLineno();
    this.expandedLines.add(lineno);
    this.collapsedLines.delete(lineno);
    scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
  }

  collapsedLine(
    collapsedLine: SourceLineComponent,
    scroller: VirtualScrollerComponent
  ): void {
    const lineno: string = collapsedLine.getLineno();
    this.expandedLines.delete(lineno);
    this.collapsedLines.add(lineno);
    scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
  }

  isLineExpanded(lineno: string): boolean {
    return this.expandedLines.has(lineno) && !this.collapsedLines.has(lineno);
  }
}
