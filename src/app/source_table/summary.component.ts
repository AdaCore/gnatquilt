import {Component, Input, ViewEncapsulation} from '@angular/core';
import {Enumerable} from '../../interface/report.model';
import {Ctx, CtxService} from '../ctx.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class SummaryComponent  {
  @Input() ctx: Ctx;

  @Input() enumerable: Enumerable;
}

