import {Enumerable, Enumerables, EnumerableService, EnumerablesService, IStats} from '../interface/report.model';
import {IReport, ISource} from '../interface/data.model';
import {Status} from '../models/app-enum';
import {Injectable} from '@angular/core';
import {LoadJsonService} from './load-json.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * computes the percentage statistics from statistics and total number of lines
 *
 * @param totalLines total number of lines
 * @param stats statistics that give for each status the number of lines
 * @return percentage stats
 */
function computePercentages(totalLines: number, stats: Map<string, number>): Map<string, number> {
  const percentages: Map<string, number> = new Map<string,number>();
  for (const covStat of stats.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    totalLines !== 0 ?
      percentages.set(covStat[0], Math.round(100 * covStat[1] / totalLines)) :
      percentages.set(covStat[0], 0);
  }
  return percentages;
}

/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param aggregate list of enumerable, i.e. object that have totalLines and stats properties
 * @return [aggregated total number of lines, aggregated statistics]
 */
function computeAggregatedStats(aggregate: Array<Enumerable> ): [number, Map<string, number>] {
  const totalLines: number =
        aggregate
          .map(enumerable => enumerable.totalLines)
          .reduce((totalProject, totalForFile) =>
            totalProject + totalForFile);

  const stats: Map<string, number> = new Map<string, number>();
  aggregate
    .map(enumerable => enumerable.stats)
    .forEach(sourceStats => {
      for (const [status, stat] of sourceStats.entries()) {
        stats.set(status, (stats.get(status) || 0) + stat);
      }
    });
  return [totalLines, stats];
}

export class Source implements IStats, Enumerable {
  filename: string;
  stats: Map<string, number> = new Map<string, number>();
  statsPercent: Map<string, number> = new Map<string, number>();
  hunkFilename: string;
  missingSource: boolean;
  project: string;
  totalLines = 0;

  constructor(source: ISource) {
    this.filename = source.filename;
    this.hunkFilename = source.hunkFilename;
    this.missingSource = source.missingSource;
    this.project = source.project;
    for (const status of Object.keys(source.stats)){
      this.stats.set(status, source.stats[status]);
    }
    this.totalLines = this.computeLines(this.stats);
    this.statsPercent = computePercentages(this.totalLines, this.stats);
  }

  computeLines(stats: Map<string, number>): number {
    for (status of Object.keys(Status)){
      this.totalLines += stats.get(status);
    }
    this.totalLines -= stats.get('noCode');
    return this.totalLines;
  }

  getName(): string {
    return this.filename;
  }
}

export class Project implements IStats, Enumerable, Enumerables {
  totalLines: number;
  stats: Map<string, number>;
  statsPercent: Map<string, number> = new Map<string, number>();
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
  stats: Map<string, number>;
  statsPercent: Map<string, number>;

  constructor(data: IReport) {
    const projects: Map<string, Project> = new Map<string, Project>();
    for (const source of data.sources) {
      const key = source.project;
      const project = projects.get(key) || new Project(key);
      project.addSource(new Source(source));
      projects.set(key, project);
    }
    for (const item of projects.entries()){
      const project = item[1];
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
      map(ireport => new Report(ireport)));
    this.total = this.report.pipe(
      map(report =>
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
