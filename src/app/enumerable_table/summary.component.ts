import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Enumerable } from '../../interface/report.model';
import { Ctx, Properties, statusProperties } from '../ctx.service';
import { Status } from '../../models/app-enum';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatTooltip],
})
export class SummaryComponent {
  @Input() ctx: Ctx;

  @Input() enumerable: Enumerable;

  statusProperties: Record<Status, Properties> = statusProperties;
}
