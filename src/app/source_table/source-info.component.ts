import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {Enumerable} from '../../interface/report.model';
import {Ctx, CtxService, Properties, statusProperties} from '../ctx.service';
import {Status} from '../../models/app-enum';

@Component({
  selector: 'app-source-info, [app-source-info]',
  templateUrl: './source-info.component.html',
  styleUrls: ['./table.component.scss'],
  // if removed, shadows parent style
  encapsulation: ViewEncapsulation.None
})

export class SourceInfoComponent implements OnInit {

  @Input() source: Enumerable;

  @Input() ctx: Ctx;

  statusProperties: Record<Status, Properties> = statusProperties;

  ngOnInit(): void{
  }
}

