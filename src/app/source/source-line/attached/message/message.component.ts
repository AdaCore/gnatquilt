import { Component, Input, OnInit } from '@angular/core';
import { Message, strLowOrUp } from '../../../../../interface/data.model';
import {
  ScoProperties,
  SourceFileService,
} from '../../../source-file/source-file.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-message, [app-message]',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
  @Input() message: Message;

  sco$: Observable<ScoProperties>;
  strLowOrUp = strLowOrUp;

  constructor(private sourceFileService: SourceFileService) {}

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
}
