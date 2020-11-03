import {Component, ContentChild, OnInit, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Status} from '../models/app-enum';
import {ReportComponent} from './report.component';
import {IReport} from '../interface/data.model';
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

  ngOnInit(): void {}
}

