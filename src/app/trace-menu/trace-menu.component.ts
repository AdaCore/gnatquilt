import { Component, OnInit } from '@angular/core';
import { ReportService, Trace } from '../report.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-trace-menu',
  templateUrl: './trace-menu.component.html',
  styleUrls: ['./trace-menu.component.scss'],
  standalone: false,
})
export class TraceMenuComponent implements OnInit {
  traces$: Observable<Iterable<[string, Trace[]]>>;

  constructor(private reportService: ReportService) {
    this.traces$ = reportService.getTraces();
  }

  getIndexClass(index: number): string {
    return index % 2 === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
  }

  ngOnInit(): void {}

  getTraces(): Observable<Iterable<[string, Trace[]]>> {
    return this.traces$;
  }
}
