import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Mapping } from '../../../interface/data.model';
import { statusProperties, symbolToStat } from '../../ctx.service';
import { Status } from '../../../models/app-enum';
import { ExpandCollapseService } from '../source-file/source-file.service';
import { ReplaySubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-source-line, [app-source-line]',
  templateUrl: './source-line.component.html',
  styleUrls: ['../style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SourceLineComponent implements OnInit, OnDestroy {
  @Input() mapping: Mapping;

  isExpanded: boolean;
  classExpanded = '';
  // Whether the line should be expanded or not and its class accordingly

  statusProperties = statusProperties;
  coverageStatus: Status;
  coverageClass: string;

  onToggleClick: () => void;
  // Callback for when the user expand/collapse a line's message /
  // instruction set.

  private selectSubscription: Subscription;
  private expandSubscription: Subscription;

  constructor(private expandCollapseService: ExpandCollapseService) {}

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
  }

  ngOnDestroy(): void {
    if (this.expandSubscription) {
      this.expandSubscription.unsubscribe();
    }
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
    return this.mapping.line.lineNumber;
  }
}
