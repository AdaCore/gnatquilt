import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
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
  SearchService,
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
    SearchService,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceFileComponent implements OnInit, OnDestroy {
  @ViewChild(EnumerableTableComponent) enumerable!: EnumerableTableComponent;
  @ViewChild(VirtualScrollerComponent) scroller!: VirtualScrollerComponent;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('scroll')
  scrollerAvailable!: QueryList<VirtualScrollerComponent>;

  source$: Observable<AnnotatedSource>;
  ctx$: Observable<Ctx>;
  selectedLine: string = '-1';
  showSearch: boolean = false;
  showHits: boolean = false;

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
    private searchService: SearchService,
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
      .subscribe((lineno: string) => this.selectLine(lineno));

    this.searchService
      .activeMatchEventListener()
      .subscribe((lineno: number) => this.scrollToMatch(lineno));
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
      for (var scroll of this.scrollerAvailable.toArray()) {
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

  selectFirstViolation() {
    this.source$.subscribe((source: AnnotatedSource) => {
      for (let mapping of source.mappings) {
        if (this.sourceService.hasViolation(mapping)) {
          this.selectLine(mapping.line.lineNumber);
          return;
        }
      }
    });
  }

  // Handling of keyboard shortcuts:
  //   * n to go to the next violation
  //   * p to go to the previous violation
  //   * CTRL+F to search for a code excerpt in the source code
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeys(event: KeyboardEvent) {
    const activeTag = document.activeElement?.tagName;

    if (this.showSearch && activeTag === 'INPUT') {
      // Don't interfere while user is typing
      return;
    }

    // Handle other keys globally
    if (event.key === 'n') {
      this.onNext();
    }
    if (event.key === 'p') {
      this.onPrevious();
    }

    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      this.toggleSearch();
    }

    if (event.key === 'Escape' && this.showSearch) {
      this.closeSearch();
    }
  }

  // Navigation to next violation
  onNext() {
    if (!this.selectedLine) {
      this.selectFirstViolation();
    } else {
      this.source$.subscribe((source: AnnotatedSource) => {
        // Note: the source.mappings line array is 0-indexed, so
        // source.mappings[selectedLine] corresponds to the line right after
        // the selected line, thus no need to adjust the offset here.
        for (
          var i = this.parseInt(this.selectedLine);
          i < source.mappings.length;
          i++
        ) {
          if (this.sourceService.hasViolation(source.mappings[i])) {
            this.selectLine(source.mappings[i].line.lineNumber);
            return;
          }
        }
      });
    }
  }

  // Navigation to previous violation
  onPrevious() {
    if (!this.selectedLine) {
      this.selectFirstViolation();
    } else {
      this.source$.subscribe((source: AnnotatedSource) => {
        // See the comment in onNext for the offset adjustment.
        for (var i = this.parseInt(this.selectedLine) - 2; i >= 0; i--) {
          if (this.sourceService.hasViolation(source.mappings[i])) {
            this.selectLine(source.mappings[i].line.lineNumber);
            return;
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Remove all subscriptions
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

  // Search related code

  toggleSearch() {
    this.showSearch = true;

    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  closeSearch() {
    this.searchService.clearHighlights();
    this.showSearch = false;
    this.searchService.reinitialize();
  }

  onSearchChange() {
    this.searchService.search(this.searchInput.nativeElement.value);
    this.showHits = this.searchService.hits() > 0;
  }

  prevMatch() {
    this.searchService.previousMatch();
  }

  nextMatch() {
    this.searchService.nextMatch();
  }

  hits() {
    return this.searchService.hits();
  }

  activeIndex() {
    return this.searchService.activeIndex();
  }

  scrollToMatch(index: number) {
    // If the element is already visible, do not use the virtual
    // scroller but native scrolling. This avoids flickering.
    //
    // Note that this also means that when using the native scroller
    // after using the virtual scrolling (e.g. when going to the next
    // match which is on the same line), it will scroll again: this is
    // deemed as a minor inconvenience.
    const indexStr = index.toString();
    const elements = document.querySelectorAll('.xcov-source-line-code');
    const el = Array.from(elements).find(
      (el) => el.textContent?.trim() === indexStr
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      this.scroller.scrollToIndex(index, false, 100, 0, undefined);
    }
  }
}
