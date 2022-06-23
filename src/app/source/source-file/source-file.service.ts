import { EventEmitter, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { LoadJsonService } from '../../load-json.service';
import { ReportService, Source } from '../../report.service';
import {
  AnnotatedSCO,
  Decision,
  ISourceAnnotated,
  Mapping,
  Range,
  Statement,
} from '../../../interface/data.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { Enumerable, Enumerables } from '../../../interface/report.model';
import { SourceLineComponent } from '../source-line/source-line.component';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

export class AnnotatedSource extends Source implements Enumerables {
  mappings: Mapping[];

  constructor(data: ISourceAnnotated) {
    super(data);
    this.mappings = data.mappings;
  }

  getHeadName(): string {
    return 'Source';
  }

  getEnumerables(): Array<Enumerable> {
    return [this];
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
  source: Observable<AnnotatedSource>;
  scos: Observable<Map<number, ScoProperties>>;
  projectName: ReplaySubject<string> = new ReplaySubject<string>();

  constructor(
    private route: ActivatedRoute,
    private loadJSONService: LoadJsonService,
    private reportService: ReportService
  ) {
    this.source = route.paramMap
      .pipe(take(1))
      .pipe(
        switchMap((paramMap: ParamMap) =>
          loadJSONService.getJSON(paramMap.get('sourceName'))
        )
      )
      .pipe(map((data: ISourceAnnotated) => new AnnotatedSource(data)));
    this.sourceStats = route.paramMap
      .pipe(
        switchMap((paramMap: ParamMap) =>
          this.reportService.getStatsForSource(
            paramMap.get('projectName'),
            paramMap.get('sourceName')
          )
        )
      )
      .pipe(
        map(
          (source: Source) =>
            new (class implements Enumerables {
              enumerable: Enumerable;

              constructor(enumerable: Enumerable) {
                this.enumerable = enumerable;
              }

              getEnumerables(): Array<Enumerable> {
                return [this.enumerable];
              }

              getHeadName(): string {
                return '';
              }
            })(source)
        )
      );
    this.scos = this.source.pipe(
      map((source: AnnotatedSource) => computeSco(source.mappings))
    );
  }

  getSource(): Observable<AnnotatedSource> {
    return this.source;
  }

  getSourceStats(): Observable<Enumerables> {
    return this.sourceStats;
  }

  getSCOS(): Observable<Map<number, ScoProperties>> {
    return this.scos;
  }

  getSCO(scoId: number): Observable<ScoProperties> {
    return this.scos.pipe(
      map((scos: Map<number, ScoProperties>) => scos.get(scoId))
    );
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
