import { Status } from '../models/app-enum';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Enumerables } from '../interface/report.model';
import { Report, ReportService } from './report.service';
import { Observable, Subscription, zip } from 'rxjs';
import { Ctx, CtxService, Properties, statusProperties } from './ctx.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class ReportComponent implements OnInit {
  total: Enumerables;
  ctx$: Observable<Ctx>;
  report$: Observable<Report>;
  total$: Observable<Enumerables>;
  data$: Observable<{ ctx: Ctx; report: Report; total: Enumerables }>;
  statusProperties: Record<Status, Properties> = statusProperties;

  private updateLevelSubscription: Subscription;

  constructor(
    public reportService: ReportService,
    public ctxService: CtxService
  ) {
    this.ctx$ = ctxService.getCtx();
    this.report$ = reportService.getReport();
    this.total$ = reportService.getTotal();
    this.data$ = zip(this.ctx$, this.report$, this.total$).pipe(
      map(([ctx, report, total]: [Ctx, Report, Enumerables]) => ({
        ctx,
        report,
        total,
      }))
    );
    reportService.computeLevelStats(reportService.getLevelStats());
    this.updateLevelSubscription = reportService.levelStatsUpdated.subscribe(
      (levels: Set<string>) => reportService.computeLevelStats(levels)
    );
  }

  ngOnInit(): void {}
}
