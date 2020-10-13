import {Component, ContentChild, OnInit, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Status} from '../models/app-enum';
import {ReportComponent} from './report.component';
import {IReport} from '../interface/data.model';

/// A component that renders a passed template
@Component({
  selector: 'app-some-child',
  providers: [],
  template: `
    <div>
      <h2>Child</h2>
        <ng-template [ngTemplateOutlet]="template" ></ng-template>
        <ng-template [ngTemplateOutlet]="template" ></ng-template>
    </div>
  `,
})
export class ChildComponent {
  @ContentChild(TemplateRef) template: TemplateRef<any>;
}


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
