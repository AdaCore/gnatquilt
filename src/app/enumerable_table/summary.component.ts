import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Enumerable } from '../../interface/report.model';
import { Ctx, Properties, statusProperties } from '../ctx.service';
import { Status } from '../../models/app-enum';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SummaryComponent implements OnInit {
  @Input() ctx: Ctx;

  @Input() enumerable: Enumerable;

  statusProperties: Record<Status, Properties> = statusProperties;

  ngOnInit(): void {}
}
