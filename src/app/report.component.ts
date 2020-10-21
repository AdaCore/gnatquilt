import {JsonObject} from '@angular/compiler-cli/ngcc/src/packages/entry_point';
import {Status} from '../models/app-enum';
import {ChangeDetectorRef, AfterContentChecked, Component, Input, OnInit} from '@angular/core';
import {map, reduce} from 'rxjs/operators';
import {Enumerable, Enumerables} from '../interface/report.model';
import {IReport, ISource} from '../interface/data.model';
import {Report, ReportService} from './report.service';
import {forkJoin, Observable, zip} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Ctx, CtxService, Properties, statusProperties} from './ctx.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./app.component.scss']
})

export class ReportComponent implements OnInit{

  total: Enumerables;
  ctx$: Observable<Ctx>;
  report$: Observable<Report>;
  total$: Observable<Enumerables>;
  data$: Observable<{ctx: Ctx; report: Report; total: Enumerables}>;
  statusProperties: Record<Status, Properties> = statusProperties;

  constructor(public reportService: ReportService, public ctxService: CtxService){
    this.ctx$ = ctxService.getCtx();
    this.report$ = reportService.getReport();
    this.total$ = reportService.getTotal();
    this.data$ = zip(this.ctx$, this.report$, this.total$).pipe(map(([ctx, report, total]) =>
      ({ctx, report, total})));
  }

  ngOnInit(): void {
  }
}
