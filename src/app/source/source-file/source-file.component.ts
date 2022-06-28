import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Mapping } from '../../../interface/data.model';
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
  ScopeMetrics,
} from './source-file.service';
import { Observable, Subject, Subscription, zip } from 'rxjs';
import { ReportService } from '../../report.service';
import { Enumerable, Enumerables } from '../../../interface/report.model';
import { VirtualScrollerComponent } from './virtual-scroller';
import { EnumerableTableComponent } from '../../enumerable_table/enumerable-table.component';

@Component({
  selector: 'app-source',
  templateUrl: './source-file.component.html',
  styleUrls: ['../style.scss'],
  providers: [SourceFileService, ExpandCollapseService],
  encapsulation: ViewEncapsulation.None,
})
export class SourceFileComponent implements OnInit, OnDestroy {
  @ViewChild(EnumerableTableComponent) enumerable!: EnumerableTableComponent;

  source$: Observable<AnnotatedSource>;
  ctx$: Observable<Ctx>;

  private updateLevelSubscription: Subscription;

  constructor(
    private ctxService: CtxService,
    private reportService: ReportService,
    private sourceService: SourceFileService,
    private expandCollapseService: ExpandCollapseService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.source$ = sourceService.getSource();
    this.ctx$ = ctxService.getCtx();
    sourceService.computeLevelStats(reportService.getLevelStats());
    this.updateLevelSubscription = reportService.levelStatsUpdated.subscribe(
      (levels: Set<string>) => {
        this.enumerable.checkChanges();
        sourceService.computeLevelStats(levels);
      }
    );
  }

  parseInt(str: string): number {
    return parseInt(str, 10);
  }

  hasAttached(mapping: Mapping): boolean {
    return (
      mapping.messages.length !== 0 || mapping.instructionSet !== undefined
    );
  }

  public checkChanges(): void {
    this.changeDetectorRef.markForCheck();
  }

  getClass(mapping: Mapping): string {
    const coverageClass: string =
      'xcov-source-line' +
      statusProperties[symbolToStat.get(mapping.coverage)].classSuffix;
    const classExpanded: string =
      this.hasAttached(mapping) &&
      this.expandCollapseService.isLineExpanded(mapping.line.lineNumber)
        ? 'xcov-source-line-expanded'
        : '';
    return coverageClass + ' ' + classExpanded;
  }

  hasMessage(mapping: Mapping): boolean {
    return mapping.messages.length !== 0;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.updateLevelSubscription.unsubscribe();
  }

  clickedOnEnumerable(
    enumerable: Enumerable,
    scroller: VirtualScrollerComponent
  ): void {
    if (enumerable instanceof ScopeMetrics) {
      scroller.scrollToIndex(enumerable.scopeLine, true, 0, 0, undefined);
    }
  }
}
