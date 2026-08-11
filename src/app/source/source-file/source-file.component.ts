import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectWindowVirtualizer } from '@tanstack/angular-virtual';
import { Mapping } from '../../../interface/data.model';
import {
  Ctx,
  CtxService,
  statusProperties,
  symbolToStat,
} from '../../ctx.service';
import {
  ExpandCollapseService,
  SourceFileService,
  ScopeMetrics,
  SelectSCOService,
  SelectLineService,
  SelectMessageService,
  SearchService,
} from './source-file.service';
import { COLLAPSED_ROW_HEIGHT, RowHeights } from './row-heights';
import { Observable, Subscription } from 'rxjs';
import { ReportService } from '../../report.service';
import { Enumerable } from '../../../interface/report.model';
import { EnumerableTableComponent } from '../../enumerable_table/enumerable-table.component';
import { SourceLineComponent } from '../source-line/source-line.component';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SourceFileModule } from '../source-file.module';
import { AsyncPipe } from '@angular/common';

/** Rows kept rendered beyond each edge of the viewport. */
const OVERSCAN = 20;

/** Not exported by @tanstack/virtual-core, so restated here. */
type ScrollAlignment = 'start' | 'center' | 'end' | 'auto';

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
    // The collapsed height is a constructor argument, so the model cannot be
    // provided by class alone.
    {
      provide: RowHeights,
      useFactory: () => new RowHeights(COLLAPSED_ROW_HEIGHT),
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    EnumerableTableComponent,
    MatCheckbox,
    FormsModule,
    MatIcon,
    SourceLineComponent,
    SourceFileModule,
    AsyncPipe,
  ],
})
export class SourceFileComponent implements OnInit, OnDestroy {
  private ctxService = inject(CtxService);
  private reportService = inject(ReportService);
  private sourceService = inject(SourceFileService);
  private expandCollapseService = inject(ExpandCollapseService);
  private selectLineService = inject(SelectLineService);
  private searchService = inject(SearchService);
  private heights = inject(RowHeights);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);

  @ViewChild(EnumerableTableComponent) enumerable!: EnumerableTableComponent;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Both live under the @if on the source, so they appear only once the report
  // has been loaded, which is well after ngAfterViewInit. Signal queries report
  // that arrival; a plain @ViewChild read once would still be undefined.
  private rowsRef = viewChild<ElementRef<HTMLElement>>('rows');
  private contentRef = viewChild<ElementRef<HTMLElement>>('content');

  source = toSignal(this.sourceService.getSource());
  ctx$: Observable<Ctx>;
  selectedLine = signal(NaN);
  showSearch = false;
  showHits = false;

  private rowCount = computed(() => this.source()?.mappings.length ?? 0);

  /**
   * Distance from the top of the document to the first row.
   *
   * Everything above the rows scrolls normally, so the virtualizer has to know
   * how much of the window scroll happens before the list starts. Re-read
   * whenever the content above changes height, the scope metrics tree being
   * expandable.
   */
  private scrollMargin = signal(0);

  /** Set when a row has to be reached but the rows are not laid out yet. */
  private pendingScroll = signal<{
    index: number;
    align: ScrollAlignment;
  } | null>(null);

  protected virtualizer = injectWindowVirtualizer(() => ({
    count: this.rowCount(),
    // Exact, not an estimate. See RowHeights: an estimate that turns out wrong
    // makes the virtualizer lay the rows out twice, and the second layout is
    // what the user sees as flicker.
    estimateSize: (index: number) => this.heights.heightOf(index),
    overscan: OVERSCAN,
    scrollMargin: this.scrollMargin(),
  }));

  private lastWidth = 0;

  private updateLevelSubscription: Subscription;
  private collapseSubscription: Subscription;
  private heightsSubscription: Subscription;

  isNumeric(value: string) {
    return /^-?\d+$/.test(value);
  }

  constructor() {
    const ctxService = this.ctxService;
    const reportService = this.reportService;
    const sourceService = this.sourceService;

    this.ctx$ = ctxService.getCtx();
    sourceService.computeLevelStats(reportService.getLevelStats());
    this.updateLevelSubscription = reportService.levelStatsUpdated.subscribe(
      (levels: Set<string>) => {
        this.enumerable.checkChanges();
        sourceService.computeLevelStats(levels);
      }
    );
    this.selectedLine.set(parseInt(this._route.snapshot.params['line']));

    // Subscribe to URL parameter changes. The user can link to a specific line
    // or a message.
    this._route.queryParams.subscribe((params: Params) => {
      this.selectedLine.set(parseInt(params['line']));

      // Check if the user also selected a message, in which case we need to
      // expand the line message contents.
      if (params['message']) {
        this.expandCollapseService.expandLine(this.selectedLine());
      }

      // Scroll to the specific line
      if (this.selectedLine()) {
        this.scrollLineno();
      }
    });
    this.selectLineService
      .selectLineEventListener()
      .subscribe((lineno: number) => this.selectLine(lineno));

    this.searchService
      .activeMatchEventListener()
      .subscribe((lineno: number) => this.scrollToMatch(lineno));

    // Watch the whole content block, not just the table: what moves the first
    // row is the header above it changing height, the scope metrics tree being
    // expandable.
    effect((onCleanup) => {
      const rows = this.rowsRef();
      const content = this.contentRef();
      if (!rows || !content) {
        return;
      }
      const observer = new ResizeObserver(() =>
        this.measureGeometry(rows.nativeElement)
      );
      observer.observe(content.nativeElement);
      this.measureGeometry(rows.nativeElement);
      onCleanup(() => observer.disconnect());
    });

    // A pending scroll waits for the rows to exist: the offset it targets only
    // becomes reachable once the spacers have given the document its height.
    // The frame delay is for that layout, not a correction of one. It happens
    // on a navigation, never while scrolling.
    effect(() => {
      const target = this.pendingScroll();
      if (target === null || this.rowCount() === 0) {
        return;
      }
      this.pendingScroll.set(null);
      requestAnimationFrame(() =>
        this.virtualizer.scrollToIndex(target.index, { align: target.align })
      );
    });
  }

  ngOnInit(): void {
    // Collapsing restores a row to the height of a plain line, which is known
    // without measuring. Expanding does not: the row reports itself once it has
    // rendered, from SourceLineComponent.
    this.collapseSubscription = this.expandCollapseService
      .collapseEventListener()
      .subscribe((lineno: number) => this.heights.collapsed(lineno - 1));

    this.heightsSubscription = this.heights
      .changedEventListener()
      .subscribe(() => this.virtualizer.measure());
  }

  /**
   * Re-reads where the rows start and how wide they are.
   *
   * Only a width change rewraps the message bodies. Dropping the measured
   * heights on a height change as well would throw them away whenever the
   * window merely got shorter, or whenever expanding a line made the page
   * taller, which is every time one is expanded.
   */
  private measureGeometry(rows: HTMLElement): void {
    this.scrollMargin.set(rows.getBoundingClientRect().top + window.scrollY);

    const width = rows.clientWidth;
    if (width !== this.lastWidth) {
      this.lastWidth = width;
      this.heights.invalidate();
    }
  }

  scrollLineno() {
    const line = this.selectedLine();
    if (!line || Number.isNaN(line)) {
      return;
    }
    // The mappings array is 0-indexed. Centring the row replaces the previous
    // trick of aiming thirty lines above it.
    this.pendingScroll.set({ index: line - 1, align: 'center' });
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
    let coverageClass: string =
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
      if (mapping.line.lineNumber == this.selectedLine()) {
        coverageClass += '-selected';
      }
    }
    return coverageClass;
  }

  hasMessage(mapping: Mapping): boolean {
    return mapping.messages.length !== 0;
  }

  selectFirstViolation() {
    for (const mapping of this.source()?.mappings ?? []) {
      if (this.sourceService.hasViolation(mapping)) {
        this.selectLine(mapping.line.lineNumber);
        return;
      }
    }
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
    const mappings = this.source()?.mappings;
    if (!mappings) {
      return;
    }
    if (!this.selectedLine()) {
      this.selectFirstViolation();
      return;
    }
    // Note: the mappings line array is 0-indexed, so mappings[selectedLine]
    // corresponds to the line right after the selected line, thus no need to
    // adjust the offset here.
    for (let i = this.selectedLine(); i < mappings.length; i++) {
      if (this.sourceService.hasViolation(mappings[i])) {
        this.selectLine(mappings[i].line.lineNumber);
        return;
      }
    }
  }

  // Navigation to previous violation
  onPrevious() {
    const mappings = this.source()?.mappings;
    if (!mappings) {
      return;
    }
    if (!this.selectedLine()) {
      this.selectFirstViolation();
      return;
    }
    // See the comment in onNext for the offset adjustment.
    for (let i = this.selectedLine() - 2; i >= 0; i--) {
      if (this.sourceService.hasViolation(mappings[i])) {
        this.selectLine(mappings[i].line.lineNumber);
        return;
      }
    }
  }

  ngOnDestroy(): void {
    // Remove all subscriptions
    this.updateLevelSubscription.unsubscribe();
    this.collapseSubscription.unsubscribe();
    this.heightsSubscription.unsubscribe();
  }

  clickedOnEnumerable(enumerable: Enumerable): void {
    if (enumerable instanceof ScopeMetrics) {
      // scopeLine is used as an index, unlike the line numbers elsewhere. Kept
      // as it was, rather than corrected blind.
      this.pendingScroll.set({ index: enumerable.scopeLine, align: 'center' });
    }
  }

  selectLine(line: number): void {
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

  scrollToMatch(lineno: number) {
    // 'auto' leaves the scroll alone when the match is already on screen, which
    // is what the previous code reached for native scrolling to obtain.
    this.pendingScroll.set({ index: lineno - 1, align: 'auto' });
  }

  /** Height of the rows scrolled past, held by a spacer row. */
  protected paddingTop(): number {
    const items = this.virtualizer.getVirtualItems();
    return items.length ? items[0].start - this.scrollMargin() : 0;
  }

  /** Height of the rows not reached yet, held by a spacer row. */
  protected paddingBottom(): number {
    const items = this.virtualizer.getVirtualItems();
    if (!items.length) {
      return 0;
    }
    const last = items[items.length - 1];
    return this.virtualizer.getTotalSize() - (last.end - this.scrollMargin());
  }
}
