import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {LoadJsonService} from '../../load-json.service';
import {Report, Source} from '../../report.service';
import {Decision, ISourceAnnotated, Mapping, Range, Statement} from '../../../interface/data.model';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {map, switchMap} from 'rxjs/operators';
import {Ctx} from '../../ctx.service';
import {Enumerable, Enumerables} from '../../../interface/report.model';

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
      for (const condition of decision.conditions) {
        scos.set(Number(condition.id), new ScoProperties('condition', condition.text, condition.range));
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
      .pipe(
        switchMap(
          (paramMap: ParamMap) => {
            loadJSONService.setUrl('assets/generated/' + paramMap.get('sourceName') + '.hunk.js');
            return loadJSONService.getJSON();
          }
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
