import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Message, strLowOrUp } from '../../../../../interface/data.model';
import {
  ScoProperties,
  SelectSCOService,
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

  sco$: Observable<ScoProperties>;
  strLowOrUp = strLowOrUp;

  constructor(
    private sourceFileService: SourceFileService,
    private selectSCOService: SelectSCOService
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
  }

  /* Hovering a tooltip triggers the change detection. This is a workaround for
    it. For more information, see
    https://github.com/angular/components/issues/10306#issuecomment-1206204298 */
  @ViewChild(MatTooltip)
  set matTooltip(v: MatTooltip) {
    delete (v as any)._viewContainerRef;
  }
}
