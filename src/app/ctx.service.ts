import {Injectable} from '@angular/core';
import {Enumerable} from '../interface/report.model';
import {Status} from '../models/app-enum';
import {ReportService} from './report.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

export class Properties {
  name: string;
  classSuffix: string;
  annotation: string;

  constructor(name: string, classSuffix: string, annotation: string) {
    this.name = name;
    this.classSuffix = classSuffix;
    this.annotation = annotation;
  }
}

function allProperties(): Record<Status, Properties> {
  const res: Record<Status, Properties> =
  { noCode: new Properties('No code', 'no-code', '.'),
    covered: new Properties ( 'Covered', '-covered', '+'),
    partiallyCovered: new Properties ('Partially Covered', '-partially-covered', '!'),
    notCovered: new Properties('Not Covered', '-not-covered', '-'),
    notCoverable: new Properties ('Not Coverable', '-not-coverable', '0'),
    exemptedNoViolation: new Properties ('Exempted no Violation', '-exempted-no-violation', '*'),
    exemptedWithViolation: new Properties ('Exempted with Violation', '-exempted-with-violation', '/')
  };
  // returning without temporary variable won't do
  return res;
}

function coverageSymbolToStatus(): Map<string, Status> {
  return new Map([
    ['.', Status.noCode],
    ['+', Status.covered],
    ['!', Status.partiallyCovered],
    ['-', Status.notCovered],
    ['0', Status.notCoverable],
    ['*', Status.exemptedWithViolation],
    ['#', Status.exemptedNoViolation]
  ]);
}
export const statusProperties: Record<Status, Properties> = allProperties();
export const symbolToStat: Map<string, Status> = coverageSymbolToStatus();

export class Ctx {
  properties: Array<Status>;
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
  propertiesOfInterest(aggregatedStats: Enumerable): Array<Status> {
    const properties: Array<Status> =
      [Status.covered, Status.partiallyCovered, Status.notCovered,
        Status.notCoverable, Status.exemptedWithViolation, Status.exemptedNoViolation];
    return properties.filter(
      (status: Status) => aggregatedStats.stats[status] !== 0
    );
  }

  /**
   * [computes the width of a coverage status table column given the number of status to be reported]
   *
   * @param pOfInterest [list of status]
   * @return [width in the coverage summary table for each status]
   */
  computeWidth(pOfInterest: Array<Status> ): number{
    const fullWidth = 60; // td `xcov-count` get 60% of the whole array.
    // totalLines is not included in propertiesOfInterest and should be included there
    return fullWidth / (Object.keys(pOfInterest).length + 1);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CtxService {

  ctx: Observable<Ctx>;

  constructor(private reportService: ReportService) {
    const data: Observable<Enumerable> = this.reportService.getReport();
    this.ctx = data.pipe(
      map((report: Enumerable) =>
        new Ctx(report)));
  }

  getCtx(): Observable<Ctx>{
    return this.ctx;
  }
}
