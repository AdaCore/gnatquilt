import {EventEmitter, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {LoadJsonService} from '../../load-json.service';
import {Report, Source} from '../../report.service';
import {Decision, ISourceAnnotated, Mapping, Range, Statement} from '../../../interface/data.model';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {map, switchMap, take} from 'rxjs/operators';
import {Ctx} from '../../ctx.service';
import {Enumerable, Enumerables} from '../../../interface/report.model';
import {SourceLineComponent} from '../source-line/source-line.component';
import {VirtualScrollerComponent} from 'ngx-virtual-scroller';

export class AnnotatedSource extends Source implements Enumerables {
  mappings: Mapping[];

  constructor(data: ISourceAnnotated){
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

  constructor(kind: string, text: string, range: Range) {
    this.kind = kind;
    this.text = text;
    this.range = range;
  }
}

/**
 * [retrieves the source coverage obligations and stores them in a map]
 *
 * @param mappings [all lines information]
 * @return [mapping of sco id to source coverage obligation properties]
 */
function computeSco(mappings: Mapping[]): Map<number, ScoProperties>{
  const scos: Map<number, ScoProperties> = new Map<number, ScoProperties>();

  for (const mapping of mappings) {
    const statements: Statement[] = mapping.statements || [];
    for (const statement of statements) {
      scos.set(Number(statement.id), new ScoProperties('statement', statement.text, statement.range));
    }

    const decisions: Decision[] = mapping.decisions || [];

    for (const decision of decisions) {
      scos.set(Number(decision.id), new ScoProperties('decision', decision.text, decision.range));
      if (decision.conditions) {
        for (const condition of decision.conditions) {
          scos.set(Number(condition.id), new ScoProperties('condition', condition.text, condition.range));
        }
      }
    }
  }
  return scos;
}

@Injectable()
export class SourceFileService  {
  source: Observable<AnnotatedSource>;
  scos: Observable<Map<number, ScoProperties>>;

  constructor(private route: ActivatedRoute, private loadJSONService: LoadJsonService) {
    this.source = route.paramMap
      .pipe(take(1))
      .pipe(
        switchMap(
          (paramMap: ParamMap) => loadJSONService.getJSON(paramMap.get('sourceName'))
        ))
      .pipe(
        map((data: ISourceAnnotated) =>
          new AnnotatedSource(data)
        )
      );

    this.scos = this.source.pipe(
      map((source: AnnotatedSource) =>
        computeSco(source.mappings)
      ));
  }

  getSource(): Observable<AnnotatedSource>{
    return this.source;
  }

  getSCOS(): Observable<Map<number, ScoProperties>>{
    return this.scos;
  }

  getSCO(scoId: number): Observable<ScoProperties> {
    return this.scos.pipe(map((scos: Map<number, ScoProperties>) => scos.get(scoId)));
  }
}

// this is a very weak strategy, and it is because of virtual scroll that we have
// to also keep track whether the file is in `expandedAll` mode or not
// The report renders only visible parts of the code.
@Injectable()
export class ExpandCollapseService {

  // event emitted when expand all button is pressed
  // listened by lines that have attached content
  expandAllEvent: EventEmitter<any> = new EventEmitter<any>();

  // same as above, for collapse all button
  collapseAllEvent: EventEmitter<any> = new EventEmitter<any>();

  expandedLines: Set<string> = new Set<string>();
  collapsedLines: Set<string> = new Set<string>();

  autoCollapse = true;
  expandedAll: boolean;

  constructor(){
    this.expandAllEvent.subscribe((next: any) =>
      this.expandedAll = true);
    this.collapseAllEvent.subscribe((next: any) =>
      this.expandedAll = false);
  }

  expandedLine(expandedLine: SourceLineComponent, scroller: VirtualScrollerComponent): void {
    // user triggered expansion with click
    if (this.autoCollapse) {
      // when auto collapsing, every expanded line other than the one clicked should collapse
      this.expandedAll = false;
      this.expandedLines.clear();
    }
    const lineno: string = expandedLine.getLineno();
    this.expandedLines.add(lineno);
    this.collapsedLines.delete(lineno);
    scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
  }

  collapsedLine(collapsedLine: SourceLineComponent, scroller: VirtualScrollerComponent): void {
    const lineno: string = collapsedLine.getLineno();
    this.expandedLines.delete(lineno);
    this.collapsedLines.add(lineno);
    scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
  }

  expandAll(scroller: VirtualScrollerComponent): void {
    // don't forget to deactivate auto-collapsing
    this.autoCollapse = false;
    this.expandAllEvent.emit(null);
    this.collapsedLines.clear();
    scroller.invalidateAllCachedMeasurements();
  }

  collapseAll(scroller: VirtualScrollerComponent): void {
    // reactivate auto-collapsing
    this.expandedLines.clear();
    this.autoCollapse = true;
    this.collapseAllEvent.emit(null);
    this.collapsedLines.clear();
    scroller.invalidateAllCachedMeasurements();
  }

  setAutoCollapse(scroller: VirtualScrollerComponent): void {
    if (this.autoCollapse) {
      this.collapseAll(scroller);
    }
  }

  isLineExpanded(lineno: string): boolean {
    return (this.expandedLines.has(lineno)
      || this.expandedAll)
      && !this.collapsedLines.has(lineno);
  }

}
