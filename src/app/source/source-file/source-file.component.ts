import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ISource, Mapping } from '../../../interface/data.model';
import {
  Ctx,
  CtxService,
  statusProperties,
  symbolToStat,
} from '../../ctx.service';
import {
  AnnotatedSource,
  ExpandCollapseService,
  SourceFileService,
} from './source-file.service';
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportService } from '../../report.service';
import { Enumerables } from '../../../interface/report.model';

export interface ISourceFile extends ISource {
  mappings: any;
}

@Component({
  selector: 'app-source',
  templateUrl: './source-file.component.html',
  styleUrls: ['../style.scss'],
  providers: [SourceFileService, ExpandCollapseService],
  encapsulation: ViewEncapsulation.None,
})
export class SourceFileComponent implements OnInit {
  source$: Observable<AnnotatedSource>;
  sourceStats$: Observable<Enumerables>;
  ctx$: Observable<Ctx>;
  data$: Observable<{
    ctx: Ctx;
    source: AnnotatedSource;
    sourceStats: Enumerables;
  }>;
  items: Array<Mapping> = new Array<Mapping>();
  boundedItemSize: any;

  constructor(
    private ctxService: CtxService,
    private reportService: ReportService,
    private sourceService: SourceFileService,
    private expandCollapseService: ExpandCollapseService
  ) {
    this.source$ = sourceService.getSource();
    this.sourceStats$ = sourceService.sourceStats;
    this.ctx$ = ctxService.getCtx();
    this.data$ = zip(this.ctx$, this.source$, this.sourceStats$).pipe(
      map(
        ([ctx, source, sourceStats]: [Ctx, AnnotatedSource, Enumerables]) => ({
          ctx,
          source,
          sourceStats,
        })
      )
    );
    this.source$.subscribe((source: AnnotatedSource) => {
      this.items = source.mappings;
    });
  }

  parseInt(str: string): number {
    return parseInt(str, 10);
  }

  hasAttached(mapping: Mapping): boolean {
    return (
      mapping.messages.length !== 0 || mapping.instructionSet !== undefined
    );
  }

  getClass(index: number, mapping: Mapping): string {
    const indexClass: string =
      index % 2 === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
    const coverageClass: string =
      'xcov-source-line' +
      statusProperties[symbolToStat.get(mapping.coverage)].classSuffix;
    const classExpanded: string =
      index < 20 &&
      this.hasAttached(mapping) &&
      this.expandCollapseService.isLineExpanded(mapping.line.lineNumber)
        ? 'xcov-source-line-expanded'
        : '';
    return indexClass + ' ' + coverageClass + ' ' + classExpanded;
  }

  hasMessage(mapping: Mapping): boolean {
    return mapping.messages.length !== 0;
  }

  ngOnInit(): void {}
}
