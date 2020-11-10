import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ReportService} from './report.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gnatquilt';
  coverageLevel$: Observable<string>;

  constructor(private reportService: ReportService) {
    this.coverageLevel$ = reportService.getCoverageLevel();
  }

  ngOnInit(): void {
  }
}

