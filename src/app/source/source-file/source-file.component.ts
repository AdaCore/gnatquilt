import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
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
  SelectSCOService,
  SelectLineService,
  SelectMessageService,
} from './source-file.service';
import { Observable, Subscription, take } from 'rxjs';
import { ReportService } from '../../report.service';
import { Enumerable } from '../../../interface/report.model';
import { VirtualScrollerComponent } from './virtual-scroller';
import { EnumerableTableComponent } from '../../enumerable_table/enumerable-table.component';
import { SourceLineComponent } from '../source-line/source-line.component';
import {
  ActivatedRoute,
  NavigationStart,
  ParamMap,
  Params,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-source',
  templateUrl: './source-file.component.html',
  styleUrls: ['../style.scss'],
  providers: [
    SourceFileService,
    ExpandCollapseService,
    SelectSCOService,
    SelectLineService,
    SelectMessageService,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceFileComponent implements OnInit, OnDestroy {
  @ViewChild(EnumerableTableComponent) enumerable!: EnumerableTableComponent;
  @ViewChild(VirtualScrollerComponent) scroller!: VirtualScrollerComponent;
  @ViewChildren('scroll')
  scrollerAvailable!: QueryList<VirtualScrollerComponent>;

  source$: Observable<AnnotatedSource>;
  ctx$: Observable<Ctx>;
  selectedLine: string = '-1';

  private updateLevelSubscription: Subscription;
  private expandSubscription: Subscription;
  private collapseSubscription: Subscription;

  isNumeric(value: string) {
    return /^-?\d+$/.test(value);
  }

  constructor(
    private ctxService: CtxService,
    private reportService: ReportService,
    private sourceService: SourceFileService,
    private expandCollapseService: ExpandCollapseService,
    private selectLineService: SelectLineService,
    private changeDetectorRef: ChangeDetectorRef,
    private _route: ActivatedRoute,
    private _router: Router
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
    this.selectedLine = this._route.snapshot.params['line'];

    // Subscribe to URL parameter changes. The user can link to a specific line
    // or a message.
    this._route.queryParams.subscribe((params: Params) => {
      this.selectedLine = params['line'];

      // Check if the user also selected a message, in which case we need to
      // expand the line message contents.
      if (params['message']) {
        this.expandCollapseService.expandLine(this.selectedLine);
      }

      // Scroll to the specific line
      if (this.selectedLine) {
        this.scrollLineno();
      }
    });
    this.selectLineService
      .selectLineEventListener()
      .subscribe((lineno: string) => {
        this.selectLine(lineno);
      });
  }

  ngAfterViewInit() {
    this.scrollerAvailable.changes.pipe(take(1)).subscribe((_) => {
      // If we don't detach this view from the change detection, the
      // scroller flickers and brings us to the top of the page. So we
      // do things manually: we scroll to the line (if it was specified)
      // and reattach the view only afterwards.
      this.changeDetectorRef.detach();
      this.scrollLineno();
    });
  }

  scrollLineno() {
    setTimeout(() => {
      for (var scroll of this.scrollerAvailable) {
        if (this.isNumeric(this.selectedLine)) {
          // Offset the scroll index to properly center the selected line
          scroll.scrollToIndex(
            this.parseInt(this.selectedLine) - 30,
            true,
            0,
            0,
            undefined
          );
          this.changeDetectorRef.reattach();
          this.changeDetectorRef.markForCheck();
        } else {
          this.changeDetectorRef.reattach();
          this.changeDetectorRef.markForCheck();
        }
      }
    }, 0);
  }

  parseInt(str: string): number {
    return parseInt(str, 10);
  }

  hasAttached(mapping: Mapping): boolean {
    return (
      mapping.messages.length !== 0 || mapping.instructionSet !== undefined
    );
  }

  getClass(mapping: Mapping): string {
    var coverageClass: string =
      'xcov-source-line' +
      statusProperties[symbolToStat.get(mapping.coverage)].classSuffix;
    // Check whether the line is expanded or not
    if (
      this.hasAttached(mapping) &&
      this.expandCollapseService.isLineExpanded(mapping.line.lineNumber)
    ) {
      coverageClass += '-expanded';
    } else {
      // Check whether the line is selected or not
      if (mapping.line.lineNumber == this.selectedLine) {
        coverageClass += '-selected';
      }
    }
    return coverageClass;
  }

  hasMessage(mapping: Mapping): boolean {
    return mapping.messages.length !== 0;
  }

  ngOnInit(): void {
    this.expandSubscription = this.expandCollapseService
      .expandEventListener()
      .subscribe((lineno: string) => {
        this.scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
      });
    this.collapseSubscription = this.expandCollapseService
      .collapseEventListener()
      .subscribe((lineno: string) => {
        this.scroller.invalidateCachedMeasurementAtIndex(Number(lineno) - 1);
      });
  }

  ngOnDestroy(): void {
    this.updateLevelSubscription.unsubscribe();
    this.expandSubscription.unsubscribe();
    this.collapseSubscription.unsubscribe();
  }

  clickedOnEnumerable(
    enumerable: Enumerable,
    scroller: VirtualScrollerComponent
  ): void {
    if (enumerable instanceof ScopeMetrics) {
      scroller.scrollToIndex(enumerable.scopeLine, true, 0, 0, undefined);
    }
  }

  selectLine(line: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        line: line,
      },
      queryParamsHandling: 'merge',
      // preserve the existing query params in the route
      skipLocationChange: false,
      // do not trigger navigation
    });
  }
}
