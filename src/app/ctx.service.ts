import { Injectable } from '@angular/core';
import {Enumerable, EnumerableService} from '../interface/report.model';
import {Status} from '../models/app-enum';
import {Report, ReportService} from './report.service';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {IReport} from '../interface/data.model';

export class StatusWihProperties {
  status: Status;
  name: string;
  classSuffix: string;
}
export class Ctx {
  properties: Array<StatusWihProperties>;
  width: number;

  constructor(aggregatedStats: Enumerable) {
    this.properties = this.propertiesOfInterest(aggregatedStats);
    this.width = this.computeWidth(this.properties);
  }

  /**
   * [computes the coverage statuses we want to report based of the project statistics]
   *
   * @param aggregatedStats [stats overview, to know for which coverage status it is interesting reporting.
   * as an example, if a project has 0 exempted lines, no need to report on exemptions]
   * @return [list of coverage status to report]
   */
  propertiesOfInterest(aggregatedStats: Enumerable): Array<StatusWihProperties> {
    const properties: Array<StatusWihProperties> = [
      {status: Status.covered, name: 'Covered', classSuffix: '-covered'},
      {status: Status.partiallyCovered, name: 'Partially Covered', classSuffix: '-partially-covered'},
      {status: Status.notCovered, name: 'Not Covered', classSuffix: '-not-covered'},
      {status: Status.notCoverable, name: 'Not Coverable', classSuffix: '-not-coverable'},
      {status: Status.exemptedNoViolation, name: 'Exempted no Violation', classSuffix: '-exempted-no-violation'},
      {status: Status.exemptedWithViolation, name: 'Exempted with Violation', classSuffix: '-exempted-with-violation'}
    ];
    return properties.filter(
      (statProp) =>
        aggregatedStats.stats.get(statProp.status) !== 0
    );
  }

  /**
   * [computes the width of a coverage status table column given the number of status to be reported]
   *
   * @param pOfInterest [list of status]
   * @return [width in the coverage summary table for each status]
   */
  computeWidth(pOfInterest: Array<StatusWihProperties> ): number{
    const fullWidth = 60; // td `xcov-count` get 60% of the whole array.
    return fullWidth / (pOfInterest.length + 1); // totalLines is not included in propertiesOfInterest and should be included there
  }
}

@Injectable({
  providedIn: 'root'
})
export class CtxService {

  loaded = false;
  ctx: Observable<Ctx>;

  constructor(private reportService: ReportService) {
    const data: Observable<Enumerable> = this.reportService.getReport();
    this.ctx = data.pipe(
      map(report => new Ctx(report)));
  }

  getCtx(): Observable<Ctx>{
    return this.ctx;
  }
}
