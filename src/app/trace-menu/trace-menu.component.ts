import { Component, inject } from '@angular/core';
import { ReportService, Trace } from '../report.service';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-trace-menu',
  templateUrl: './trace-menu.component.html',
  styleUrls: ['./trace-menu.component.scss'],
  imports: [RouterLink, MatTooltip, AsyncPipe],
})
export class TraceMenuComponent {
  private reportService = inject(ReportService);

  traces$: Observable<Iterable<[string, Trace[]]>>;

  constructor() {
    const reportService = this.reportService;

    this.traces$ = reportService.getTraces();
  }

  getIndexClass(index: number): string {
    return index % 2 === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
  }

  getTraces(): Observable<Iterable<[string, Trace[]]>> {
    return this.traces$;
  }
}
