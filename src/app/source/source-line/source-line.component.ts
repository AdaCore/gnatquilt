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
import { ReplaySubject, Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-source-line, [app-source-line]',
  templateUrl: './source-line.component.html',
  styleUrls: ['../style.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceLineComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mapping: Mapping;
  @Input() language: string;
  @ViewChild('sourceCode') sourceCode!: ElementRef<HTMLTableCellElement>;

  isExpanded: boolean;
  classExpanded = '';
  // Whether the line should be expanded or not and its class accordingly

  statusProperties = statusProperties;
  coverageStatus: Status;
  coverageClass: string;

  searchMatches: number = 0;
  // Number of search matches on the line

  onToggleClick: () => void;
  // Callback for when the user expand/collapse a line's message /
  // instruction set.

  private selectSubscription: Subscription;
  private expandSubscription: Subscription;
  private searchSubscription: Subscription;
  private activeMatchSubscription: Subscription;

  getHTMLText: ReplaySubject<string> = new ReplaySubject(1);
  // HTML excerpt for the source code. To implement SCO selection, we need to potentially
  // split the source code into different spans to differentiate the parts of the source line
  // that are a part of the SCO from the parts that are not:
  //   * A single span if the source code line does not belong to the selected SCO
  //   * A single span if SCO starts before the source code line, and ends after.
  //   * Two spans if the SCO starts at the source code line, but ends at another one,
  //     or if ends at the source code line, but starts at another one.
  //   * Three spans if the SCO starts at the source code line and ends on it.

  constructor(
    private host: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private selectSCOService: SelectSCOService,
    private expandCollapseService: ExpandCollapseService,
    private selectLineService: SelectLineService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.coverageStatus = symbolToStat.get(this.mapping.coverage);
    this.coverageClass =
      'xcov-source-line' + statusProperties[this.coverageStatus].classSuffix;

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.onToggleClick = this.hasAttached() ? this.expandOrCollapse : () => {};
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
        .subscribe((lineno: string) => {
          if (
            lineno != this.mapping.line.lineNumber &&
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

    // Subscribe to search changes
    this.searchSubscription = this.searchService
      .searchEventListener()
      .subscribe((_) => this.updateSearch());
    this.activeMatchSubscription = this.searchService
      .activeMatchEventListener()
      .subscribe((linenumber) => {
        if (parseInt(this.mapping.line.lineNumber) == linenumber) {
          this.searchService.showActiveMatch(
            this.host.nativeElement,
            parseInt(this.mapping.line.lineNumber)
          );
        }
      });
  }

  updateSearch(): void {
    this.searchService.showMatchesInDom(
      this.host.nativeElement,
      parseInt(this.mapping.line.lineNumber)
    );
  }

  ngAfterViewInit(): void {
    this.updateSearch();
    this.searchService.showActiveMatch(
      this.host.nativeElement,
      parseInt(this.mapping.line.lineNumber)
    );
  }

  ngOnDestroy(): void {
    if (this.expandSubscription) {
      this.expandSubscription.unsubscribe();
    }
    if (this.selectSubscription) {
      this.selectSubscription.unsubscribe();
    }
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

  getLineno(): string {
    // TODO: return number rather than string and do the code adaptations
    return this.mapping.line.lineNumber;
  }

  /* Hovering a tooltip triggers the change detection. This is a workaround for
  it. For more information, see
  https://github.com/angular/components/issues/10306#issuecomment-1206204298 */
  @ViewChild(MatTooltip)
  set matTooltip(v: MatTooltip) {
    delete (v as any)._viewContainerRef;
  }

  onSelectLine(): void {
    this.selectLineService.emitSelectLineEvent(this.getLineno());
  }
}
