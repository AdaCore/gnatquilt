import {Enumerable, Enumerables, EnumerableService, EnumerablesService} from '../interface/report.model';
import {IReport, ISource} from '../interface/data.model';
import {initStatus, Status} from '../models/app-enum';
import {Injectable} from '@angular/core';
import {LoadJsonService} from './load-json.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {Properties, statusProperties} from './ctx.service';

/**
 * computes the percentage statistics from statistics and total number of lines
 *
 * @param totalLines total number of lines
 * @param stats statistics that give for each status the number of lines
 * @return percentage stats
 */
function computePercentages(totalLines: number, stats: Record<Status, number>): Record<Status, number> {
  const percentages: Record<Status, number> = initStatus();
  for (const [status, covStat] of Object.entries(stats)) {
    percentages[status] =
    totalLines !== 0 ?
      Math.round(100 * covStat / totalLines): 0;
  }
  return percentages;
}

/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param aggregate list of enumerable, i.e. object that have totalLines and stats properties
 * @return [aggregated total number of lines, aggregated statistics]
 */
function computeAggregatedStats(aggregate: Array<Enumerable> ): [number, Record<Status, number>] {
  const totalLines: number =
        aggregate
          .map((enumerable: Enumerable) => enumerable.totalLines)
          .reduce((totalProject: number, totalForFile: number) =>
            totalProject + totalForFile);


  const stats: Record<Status, number> = initStatus();
  aggregate
    .map((enumerable: Enumerable) => enumerable.stats)
    .forEach((sourceStats: Record<Status, number>) => {
      for (const [status, stat] of Object.entries(sourceStats)) {
        // have to add a type assertion because status is a string
        // (there is no way to only loop over the `Status` properties
        // of the Record object).
        // For that reason, property access may not be a number (even though the
        // surrounding type is `Record<Status, number>`, JS objects are extensible
        // and a property could be runtime added).
        // The resulting expression may then be `any` type, and it is rejected by the compiler
        // without the type assertion.
        stats[status] = (stats[status] as number)  + stat;
      }
    });
  return [totalLines, stats];
}

export class Source implements ISource, Enumerable {
  filename: string;
  stats: Record<Status, number> = initStatus();
  statsPercent: Record<Status, number> = initStatus();
  hunkFilename: string;
  missingSource: boolean;
  project: string;
  totalLines = 0;

  constructor(source: ISource, debug = false) {
    Object.assign(this, source);
    this.totalLines = this.computeLines(this.stats);
    if(debug){
      console.log(this.totalLines);
    }
    this.statsPercent = computePercentages(this.totalLines, this.stats);
  }

  computeLines(stats: Record<Status, number>): number {
    this.totalLines = Object.values(stats).reduce((sum: number, current: number) => sum + current);
    this.totalLines -= stats.noCode;
    return this.totalLines;
  }

  getName(): string {
    return this.filename;
  }
}

export class Project implements  Enumerable, Enumerables {
  totalLines: number;
  stats: Record<Status, number> = initStatus();
  statsPercent: Record<Status, number> = initStatus();
  projectFiles: Source[] = [];

  constructor(public projectName: string) {
    this.projectName = projectName;
  }

  addSource(source: Source): void {
    this.projectFiles.push(source);
  }

  computeStats(): void {

    [this.totalLines, this.stats] = computeAggregatedStats(this.projectFiles);

    this.statsPercent = computePercentages(this.totalLines, this.stats);
  }

  getName(): string {
    return this.projectName;
  }

  getEnumerables(): Array<Enumerable> {
    return this.projectFiles;
  }

  getHeadName(): string {
    return 'Sources';
  }
}

export class Report implements Enumerables, Enumerable {
  projects: Project[];
  totalLines: number;
  stats: Record<Status, number> = initStatus();
  statsPercent: Record<Status, number> = initStatus();

  constructor(data: IReport) {
    const projects: Map<string, Project> = new Map<string, Project>();
    for (const source of data.sources) {
      const key: string = source.project;
      const project: Project = projects.get(key) || new Project(key);
      project.addSource(new Source(source));
      projects.set(key, project);
    }
    for (const item of projects.entries()){
      const project: Project = item[1];
      project.computeStats();
    }
    [this.totalLines, this.stats] = computeAggregatedStats(Array.from(projects.values()));
    this.statsPercent = computePercentages(this.totalLines, this.stats);
    this.projects = Array.from(projects.values());
  }

  getName: () => string = () => 'Total';

  getEnumerables(): Array<Enumerable> {
    return this.projects;
  }

  getHeadName(): string {
    return 'Projects';
  }
}

@Injectable({
  providedIn: 'root'
})

export class ReportService  {
  report: Observable<Report>;
  total: Observable<Enumerables>;

  constructor(private loadJSONService: LoadJsonService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: Observable<IReport> = this.loadJSONService.getJSON();
    this.report =   data.pipe(
      map((ireport: IReport) => new Report(ireport)));
    this.total = this.report.pipe(
      map((report: Report) =>
        new class implements Enumerables {
          enumerable: Enumerable;
          constructor(enumerable: Enumerable){
            this.enumerable = enumerable;
          }
          getEnumerables(): Array<Enumerable> {
            return [this.enumerable];
          }

          getHeadName(): string {
            return '';
          }
        }(report)
      )
    );
  }

  getReport(): Observable<Report> {
    return this.report;
  }

  getTotal(): Observable<Enumerables> {
    return this.total;
  }

}
