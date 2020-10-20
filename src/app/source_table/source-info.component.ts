import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {Enumerable} from '../../interface/report.model';
import {Ctx, CtxService} from '../ctx.service';

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

  ngOnInit(): void{
  }
}

