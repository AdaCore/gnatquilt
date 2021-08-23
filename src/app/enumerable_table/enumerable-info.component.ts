import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Enumerable } from '../../interface/report.model';
import { Ctx, Properties, statusProperties } from '../ctx.service';
import { Status } from '../../models/app-enum';
import { Source } from '../report.service';

@Component({
  selector: 'app-enumerable-info, [app-enumerable-info]',
  templateUrl: './enumerable-info.component.html',
  styleUrls: ['./style.scss'],
  // if removed, shadows parent style
  encapsulation: ViewEncapsulation.None,
})
export class EnumerableInfoComponent implements OnInit {
  @Input() enumerable: Enumerable;

  @Input() ctx: Ctx;

  @Input() isSource: boolean;

  @Input() projectName: string;

  statusProperties: Record<Status, Properties> = statusProperties;

  getHunkFilename(enumerable: Enumerable): string {
    const source: Source = enumerable as Source;
    return source.getHunkFilename();
  }

  ngOnInit(): void {}

  getStat(e: Enumerable, status: string): number {
    return e.getStats()[status] as number;
  }
}
