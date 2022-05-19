import { Injectable } from '@angular/core';
import { Enumerable } from '../interface/report.model';
import { Status } from '../models/app-enum';
import { ReportService } from './report.service';
import { Observable, ReplaySubject } from 'rxjs';

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
  const res: Record<Status, Properties> = {
    noCode: new Properties('No code', '-no-code', '.'),
    covered: new Properties('Covered', '-covered', '+'),
    partiallyCovered: new Properties(
      'Partially Covered',
      '-partially-covered',
      '!'
    ),
    notCovered: new Properties('Not Covered', '-not-covered', '-'),
    notCoverable: new Properties('Not Coverable', '-not-coverable', '0'),
    notInstrumented: new Properties(
      'Not Instrumented',
      '-not-instrumented',
      '?'
    ),
    exemptedNoViolation: new Properties(
      'Exempted no Violation',
      '-exempted-no-violation',
      '*'
    ),
    exemptedWithViolation: new Properties(
      'Exempted with Violation',
      '-exempted-with-violation',
      '#'
    ),
    exemptedWithNonInstr: new Properties(
      'Exempted with Non Instrumented items',
      '-exempted-with-non-instr',
      '@'
    ),
    // only for assembly coverage
    unknown: new Properties('Unknown', '-unknown', '~'),
    fallthroughTaken: new Properties(
      'Fallthrough Taken',
      '-partially-covered',
      '↓'
    ),
    branchTaken: new Properties('Branch Taken', '-partially-covered', '→'),
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
    ['?', Status.notInstrumented],
    ['*', Status.exemptedWithViolation],
    ['@', Status.exemptedWithNonInstr],
    ['#', Status.exemptedNoViolation],
    ['~', Status.unknown],
    ['>', Status.branchTaken],
    ['v', Status.fallthroughTaken],
  ]);
}
export const statusProperties: Record<Status, Properties> = allProperties();
export const symbolToStat: Map<string, Status> = coverageSymbolToStatus();

export class Ctx {
  properties: Array<Status>;
  width: number;
  levels: Set<string> = new Set();

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
    const properties: Array<Status> = [
      Status.covered,
      Status.partiallyCovered,
      Status.notCovered,
      Status.notCoverable,
      Status.notInstrumented,
      Status.exemptedWithViolation,
      Status.exemptedWithNonInstr,
      Status.exemptedNoViolation,
    ];
    return properties.filter(
      (status: Status) => aggregatedStats.getStats()[status] !== 0
    );
  }

  /**
   * [computes the width of a coverage status table column given the number of status to be reported]
   *
   * @param pOfInterest [list of status]
   * @return [width in the coverage summary table for each status]
   */
  computeWidth(pOfInterest: Array<Status>): number {
    // rule conflicting with no-inferrable-types
    // eslint-disable-next-line @typescript-eslint/typedef
    const fullWidth = 60; // td `xcov-count` get 60% of the whole array.
    // totalLines is not included in propertiesOfInterest and should be included there
    return fullWidth / (Object.keys(pOfInterest).length + 1);
  }
}

@Injectable({
  providedIn: 'root',
})
export class CtxService {
  ctx$: ReplaySubject<Ctx> = new ReplaySubject<Ctx>(1);
  ctx: Observable<Ctx> = this.ctx$.asObservable();

  constructor(private reportService: ReportService) {
    const data: Observable<Enumerable> = this.reportService.getReport();
    data.subscribe((report: Enumerable) => this.ctx$.next(new Ctx(report)));
  }

  getCtx(): Observable<Ctx> {
    return this.ctx;
  }
}
