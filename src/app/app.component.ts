import {Component, ContentChild, OnInit, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Status} from '../models/app-enum';
import {ReportComponent} from './report.component';
import {IReport} from '../interface/data.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gnatquilt';
  dataJson: Observable<IReport>;
  // TODO: generate JSON verification code
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dynamicallyLoadJsonFile: Promise<IReport> = import(('../assets/report.json'));
  report: ReportComponent;

  ngOnInit(): void{
    this.dataJson = fromPromise(this.dynamicallyLoadJsonFile);
  }

  createRow(): void{

  }


}
