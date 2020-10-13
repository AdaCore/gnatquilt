import {JsonObject} from '@angular/compiler-cli/ngcc/src/packages/entry_point';
import {Status} from '../models/app-enum';
import {ChangeDetectorRef, AfterContentChecked, Component, Input, OnInit} from '@angular/core';
import {reduce} from 'rxjs/operators';
import {Enumerable, Enumerables, IStats} from '../interface/report.model';
import {IReport, ISource} from '../interface/data.model';
import {Ctx, Report} from './report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./app.component.scss']
})

export class ReportComponent implements OnInit{

  @Input() data: IReport;

  coverageLevel: string;
  traces: string;
  report: Report;
  ctx: Ctx;
  total: Enumerables;
  hasExempted: boolean;

  constructor(){}


  ngOnInit(): void {
    this.coverageLevel = this.data.coverageLevel.toString();
    this.report = new Report(this.data);
    this.total = new class implements Enumerables {
      report: Enumerable;
      constructor(report: Enumerable){
        this.report = report;
      }
      getEnumerables(): Array<Enumerable> {
        return [this.report];
      }

      getHeadName(): string {
        return '';
      }
    }(this.report);
    this.ctx = new Ctx(this.report);
  }
}
