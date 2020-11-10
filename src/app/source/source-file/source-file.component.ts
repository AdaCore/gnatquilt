import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ISource, Mapping} from '../../../interface/data.model';
import {Ctx, CtxService, statusProperties, symbolToStat} from '../../ctx.service';
import {AnnotatedSource, ExpandCollapseService, SourceFileService} from './source-file.service';
import {Observable, zip} from 'rxjs';
import {map} from 'rxjs/operators';
import {SourceLineComponent} from '../source-line/source-line.component';
import {VirtualScrollerComponent} from 'ngx-virtual-scroller';

export interface ISourceFile extends ISource {
  mappings: any;
}

@Component({
  selector: 'app-source',
  templateUrl: './source-file.component.html',
  styleUrls: ['../style.scss'],
  providers: [SourceFileService, ExpandCollapseService],
  encapsulation: ViewEncapsulation.None
})

export class SourceFileComponent implements OnInit {
  source$: Observable<AnnotatedSource>;
  ctx$: Observable<Ctx>;
  data$: Observable<{ctx: Ctx; source: AnnotatedSource}>;
  items: Array<Mapping> = new Array<Mapping>();
  boundedItemSize: any;

  constructor(private ctxService: CtxService,
              private sourceService: SourceFileService,
              private expandCollapseService: ExpandCollapseService){
    this.source$ = sourceService.getSource();
    this.ctx$ = ctxService.getCtx();
    this.data$ = zip(this.ctx$, this.source$)
      .pipe(
        map(([ctx, source]: [Ctx, AnnotatedSource]) =>
          ({ctx, source})));
    this.source$.subscribe((source: AnnotatedSource) => {
      this.items = source.mappings;
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.boundedItemSize = this.getItemSize.bind(this);
  }


  parseInt(str: string): number{
    return parseInt(str, 10);
  }

  hasAttached(mapping: Mapping): boolean {
    return mapping.message !== undefined || mapping.instructionSet !== undefined;
  }

  getClass(index: number, mapping: Mapping): string{
    const indexClass: string = (index % 2) === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
    const coverageClass: string = 'xcov-source-line' + statusProperties[symbolToStat.get(mapping.coverage)].classSuffix;
    const hiddenClass: string = index < 20 ? 'hidden':'';
    const classExpanded: string =
      index < 20 && this.hasAttached(mapping) && this.expandCollapseService.isLineExpanded(mapping.line.lineNumber) ?
        'xcov-source-line-expanded':'';
    return indexClass + ' ' + coverageClass + ' ' + classExpanded;
  }

  hasMessage(mapping: Mapping): boolean {
    return mapping.message !== undefined;
  }
  getItemSize(index: number): number {
    // eslint-disable-next-line @typescript-eslint/typedef
    const messageHeight = 79;
    // eslint-disable-next-line @typescript-eslint/typedef
    const normalHeight = 20;
    // eslint-disable-next-line @typescript-eslint/typedef
    const mapping = this.items[index];
    if (mapping.message !== undefined && this.expandCollapseService.isLineExpanded(mapping.line.lineNumber)) {
      return messageHeight;
    }
    return normalHeight;
  }

  ngOnInit(): void {}

}
