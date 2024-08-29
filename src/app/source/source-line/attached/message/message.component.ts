import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Message, strLowOrUp } from '../../../../../interface/data.model';
import {
  ScoProperties,
  SelectSCOService,
  SelectMessageService,
  SourceFileService,
} from '../../../source-file/source-file.service';
import { Observable, take } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-message, [app-message]',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
  @Input() message: Message;
  @Input() line: string;
  @Input() message_id: string;

  sco$: Observable<ScoProperties>;
  strLowOrUp = strLowOrUp;

  // Suffix indicating whether the message has been selected or not
  selectedSuffix: string = '';

  constructor(
    private sourceFileService: SourceFileService,
    private selectSCOService: SelectSCOService,
    private selectMessageService: SelectMessageService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  showText(): void {
    this.sco$.pipe(take(1)).subscribe((sco: ScoProperties) => {
      this.selectSCOService.emitSelectSCOEvent(sco.range);
    });
  }

  hasSco(): boolean {
    return this.message.kind !== 'info' && this.message.sco !== undefined;
  }

  getScoId(): number {
    let regex: RegExp;
    // eslint-disable-next-line prefer-const
    regex = new RegExp(/\d+/);
    return Number(regex.exec(this.message.sco)[0]);
  }

  ngOnInit(): void {
    if (this.hasSco()) {
      this.sco$ = this.sourceFileService.getSCO(this.getScoId());
    }
    this.selectMessageService
      .selectMessageEventListener()
      .subscribe(([line, message]: [string, string]) => {
        if (line == this.line && message == this.message_id) {
          this.selectedSuffix = '-selected';
        } else {
          this.selectedSuffix = '';
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  /* Hovering a tooltip triggers the change detection. This is a workaround for
    it. For more information, see
    https://github.com/angular/components/issues/10306#issuecomment-1206204298 */
  @ViewChild(MatTooltip)
  set matTooltip(v: MatTooltip) {
    delete (v as any)._viewContainerRef;
  }

  onSelectMessage(event): void {
    // Avoid triggering the line selection in addition to the violation selection
    event.stopPropagation();
    this.selectMessageService.emitSelectMessageEvent(
      this.line,
      this.message_id
    );
  }
}
