import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Mapping, Range } from '../../../interface/data.model';
import { statusProperties, symbolToStat } from '../../ctx.service';
import { Status } from '../../../models/app-enum';
import {
  ExpandCollapseService,
  SearchService,
  SelectLineService,
  SelectSCOService,
} from '../source-file/source-file.service';
import { RowHeights } from '../source-file/row-heights';
import { ReplaySubject, Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MessageComponent } from './attached/message/message.component';
import { InstructionSetComponent } from './attached/instruction-set/instruction-set.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-source-line, [app-source-line]',
  templateUrl: './source-line.component.html',
  styleUrls: ['../style.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIcon,
    MatTooltip,
    MessageComponent,
    InstructionSetComponent,
    AsyncPipe,
  ],
})
export class SourceLineComponent implements OnInit, AfterViewInit, OnDestroy {
  private host = inject(ElementRef);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private selectSCOService = inject(SelectSCOService);
  private expandCollapseService = inject(ExpandCollapseService);
  private selectLineService = inject(SelectLineService);
  private searchService = inject(SearchService);
  private heights = inject(RowHeights);

  @Input() mapping: Mapping;
  @Input() language: string;
  /** Index of this row in the mappings array, one below the line number. */
  @Input() index: number;
  @ViewChild('sourceCode') sourceCode!: ElementRef<HTMLTableCellElement>;

  isExpanded: boolean;
  classExpanded = '';
  // Whether the line should be expanded or not and its class accordingly

  statusProperties = statusProperties;
  coverageStatus: Status;
  coverageClass: string;

  searchMatches = 0;
  // Number of search matches on the line

  private selectSubscription: Subscription;
  private expandSubscription: Subscription;
  private invalidatedSubscription: Subscription;
  private searchSubscription: Subscription;
  private activeMatchSubscription: Subscription;

  getHTMLText = new ReplaySubject<string>(1);

  ngOnInit(): void {
    this.coverageStatus = symbolToStat.get(this.mapping.coverage);
    this.coverageClass =
      'xcov-source-line' + statusProperties[this.coverageStatus].classSuffix;

    if (this.hasAttached()) {
      // Check if the line was expanded
      this.isExpanded = this.expandCollapseService.isLineExpanded(
        this.mapping.line.lineNumber
      );
      if (this.isExpanded) {
        this.isExpanded = true;
        this.classExpanded = 'xcov-source-line-expanded';
      }
      // Subscribe to any expansion event to implement the auto-collapse
      // mechanism.
      this.expandSubscription = this.expandCollapseService
        .expandEventListener()
        .subscribe((lineno: number) => {
          if (
            lineno != this.getLineno() &&
            this.expandCollapseService.autoCollapse &&
            this.isExpanded
          ) {
            this.isExpanded = false;
            this.classExpanded = '';
            this.changeDetectorRef.markForCheck();
          }
        });
    }
    this.getHTMLText.next(
      this.selectSCOService.safe_span(this.mapping.line.src, this.language)
    );

    // Check if the current line is selected. As of now, only SCOs that were
    // not covered can be selected, so only consider lines that have coverage
    // violations.
    if (this.mapping.coverage != '.' && this.mapping.coverage != '+') {
      this.selectSubscription = this.selectSCOService
        .selectSCOEventListener()
        .subscribe((rng: Range) => {
          this.getHTMLText.next(
            this.selectSCOService.selectText(rng, this.mapping, this.language)
          );
        });
    }

    // A width change rewraps the message bodies, so a height measured before it
    // is worthless. The row is on screen and already relaid out by the time this
    // fires, so it can be read straight away.
    this.invalidatedSubscription = this.heights
      .invalidatedEventListener()
      .subscribe(() => {
        if (this.isExpanded) {
          this.reportHeight();
        }
      });

    // Subscribe to search changes
    this.searchSubscription = this.searchService
      .searchEventListener()
      .subscribe((_) => this.updateSearch());
    this.activeMatchSubscription = this.searchService
      .activeMatchEventListener()
      .subscribe((linenumber) => {
        if (this.getLineno() == linenumber) {
          this.searchService.showActiveMatch(
            this.host.nativeElement,
            this.getLineno()
          );
        }
      });
  }

  updateSearch(): void {
    this.searchService.showMatchesInDom(
      this.host.nativeElement,
      this.getLineno()
    );
  }

  ngAfterViewInit(): void {
    this.updateSearch();
    this.searchService.showActiveMatch(
      this.host.nativeElement,
      this.getLineno()
    );
    // A row that comes into view already expanded has a height nobody measured
    // yet: it was expanded from the query parameter, or its measurement was
    // dropped by a resize while it was out of view.
    if (this.isExpanded) {
      this.reportHeight();
    }
  }

  /**
   * Tells the height model what this row occupies.
   *
   * Only ever called on a discrete change: an expansion, a resize, or the row
   * appearing. Never on a scroll, which is what keeps the rows from being laid
   * out twice per frame.
   */
  private reportHeight(): void {
    this.heights.expanded(this.index, this.host.nativeElement.offsetHeight);
  }

  ngOnDestroy(): void {
    if (this.expandSubscription) {
      this.expandSubscription.unsubscribe();
    }
    if (this.selectSubscription) {
      this.selectSubscription.unsubscribe();
    }
    this.invalidatedSubscription.unsubscribe();
    this.searchSubscription.unsubscribe();
    this.activeMatchSubscription.unsubscribe();
  }

  collapseAttached(): void {
    this.isExpanded = false;
    this.classExpanded = '';
    this.expandCollapseService.collapseLine(this.getLineno());
  }

  expandAttached(): void {
    this.isExpanded = true;
    this.classExpanded = 'xcov-source-line-expanded';
    this.expandCollapseService.expandLine(this.getLineno());
    // Wait for the next frame and for the click to render prior to measuring
    // the height of the expanded item.
    requestAnimationFrame(() => this.reportHeight());
  }

  expandOrCollapse(): void {
    if (this.isExpanded) {
      this.collapseAttached();
    } else {
      this.expandAttached();
    }
  }

  hasAttached(): boolean {
    return (
      this.mapping.messages.length !== 0 ||
      this.mapping.instructionSet !== undefined
    );
  }

  hasMessage(): boolean {
    return this.mapping.messages.length !== 0;
  }

  getLineno(): number {
    return this.mapping.line.lineNumber;
  }

  /* Hovering a tooltip triggers the change detection. This is a workaround for
  it. For more information, see
  https://github.com/angular/components/issues/10306#issuecomment-1206204298 */
  @ViewChild(MatTooltip)
  set matTooltip(v: MatTooltip) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (v as any)._viewContainerRef;
  }

  onSelectLine(): void {
    this.selectLineService.emitSelectLineEvent(this.getLineno());
  }
}
