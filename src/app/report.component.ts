import { Status } from '../models/app-enum';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Enumerables } from '../interface/report.model';
import { Report, ReportService } from './report.service';
import { Observable, Subscription, zip } from 'rxjs';
import { Ctx, CtxService, Properties, statusProperties } from './ctx.service';
import { RouterLink } from '@angular/router';
import { EnumerableTableComponent } from './enumerable_table/enumerable-table.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterLink, EnumerableTableComponent, AsyncPipe],
})
export class ReportComponent {
  reportService = inject(ReportService);
  ctxService = inject(CtxService);

  total: Enumerables;
  ctx$: Observable<Ctx>;
  report$: Observable<Report>;
  total$: Observable<Enumerables>;
  data$: Observable<{ ctx: Ctx; report: Report; total: Enumerables }>;
  statusProperties: Record<Status, Properties> = statusProperties;

  private updateLevelSubscription: Subscription;

  constructor() {
    const reportService = this.reportService;
    const ctxService = this.ctxService;

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
}
