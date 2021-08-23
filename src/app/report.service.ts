import { Enumerable, Enumerables } from '../interface/report.model';
import { EntityStats, IReport, ISource, ITrace } from '../interface/data.model';
import { initStatus, Status } from '../models/app-enum';
import { Injectable } from '@angular/core';
import { LoadJsonService } from './load-json.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

/**
 * computes the percentage statistics from statistics and total number of lines
 *
 * @param totalLines total number of lines
 * @param stats statistics that give for each status the number of lines
 * @return percentage stats
 */
function computePercentages(
  totalLines: number,
  stats: Record<Status, number>
): Record<Status, number> {
  const percentages: Record<Status, number> = initStatus();
  for (const [status, covStat] of Object.entries(stats)) {
    percentages[status] =
      totalLines !== 0 ? Math.round((100 * covStat) / totalLines) : 0;
  }
  return percentages;
}

/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param aggregate: list of enumerable, i.e. object that have totalLines and stats properties
 * @return [aggregated total number of lines, aggregated statistics]
 */
function computeAggregatedStats(
  aggregate: Array<Enumerable>
): [number, Record<Status, number>] {
  const totalLines: number = aggregate
    .map((enumerable: Enumerable) => enumerable.totalLines)
    .reduce(
      (totalProject: number, totalForFile: number) =>
        totalProject + totalForFile
    );
  const stats: Record<Status, number> = initStatus();
  aggregate
    .map((enumerable: Enumerable) => enumerable.getStats())
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
        stats[status] = (stats[status] as number) + stat;
      }
    });
  return [totalLines, stats];
}
/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param enAllStats: entities stats, i.e. coverage obligations stats for each coverage level
 * @param levels: list of level strings for which we want to compute stats aggregation
 * @return [aggregated total number of coverage obligations, aggregated statistics]
 */
function aggregateEntitiesStats(
  enAllStats: Array<EntityStats>,
  levels: Set<string>
): [number, Record<Status, number>] {
  const enStats: Record<Status, number> = initStatus();
  // eslint-disable-next-line @typescript-eslint/typedef
  let totalLines = 0;
  enAllStats.forEach((entity: EntityStats) => {
    if (levels.has(entity.level)) {
      for (const [status, _stat] of Object.entries(entity.stats)) {
        enStats[status] += entity.stats[status];
        totalLines += entity.stats[status];
      }
    }
  });
  return [totalLines, enStats];
}

export enum StatKindType {
  entities,
  lines,
}
export let statKind: StatKindType = StatKindType.lines;
export function setStatKind(setKind: StatKindType): void {
  statKind = setKind;
}

abstract class Stats implements Enumerable {
  liStats: Record<Status, number> = initStatus();
  enStats: Record<Status, number> = initStatus();
  statsPercent: Record<Status, number> = initStatus();
  totalLines = 0;

  getStats(): Record<Status, number> {
    switch (statKind) {
      case StatKindType.entities:
        return this.enStats;
      case StatKindType.lines:
        return this.liStats;
    }
  }

  getStatsPercent(): Record<Status, number> {
    return this.statsPercent;
  }

  abstract getName(): string;
}

export class Source extends Stats implements ISource, Enumerable {
  filename: string;
  hunkFilename: string;
  missingSource: boolean;
  project: string;
  totalLines = 0;
  enAllStats: Array<EntityStats>;

  constructor(source: ISource) {
    super();
    Object.assign(this, source);
    this.totalLines = this.computeLines(this.liStats);
    this.statsPercent = computePercentages(this.totalLines, this.liStats);
    this.missingSource = source.missingSource;
  }

  computeLines(stats: Record<Status, number>): number {
    this.totalLines = Object.values(stats).reduce(
      (sum: number, current: number) => sum + current
    );
    this.totalLines -= stats.noCode;
    return this.totalLines;
  }

  getName(): string {
    return this.filename;
  }

  getHunkFilename(): string {
    return this.hunkFilename;
  }

  computeStats(levels: Set<string>): void {
    switch (statKind) {
      case StatKindType.lines:
        this.totalLines = Object.values(this.liStats).reduce(
          (sum: number, current: number) => sum + current
        );
        this.totalLines -= this.liStats.noCode;
        break;
      case StatKindType.entities:
        [this.totalLines, this.enStats] = aggregateEntitiesStats(
          this.enAllStats,
          levels
        );
        break;
    }
    this.statsPercent = computePercentages(this.totalLines, this.getStats());
  }
}

export class Project extends Stats implements Enumerable, Enumerables {
  totalLines: number;
  projectFiles: Source[] = [];

  constructor(public projectName: string) {
    super();
    this.projectName = projectName;
  }

  addSource(source: Source): void {
    this.projectFiles.push(source);
  }

  computeStats(levels: Set<string>): void {
    this.projectFiles.forEach((s: Source) => {
      s.computeStats(levels);
    });
    switch (statKind) {
      case StatKindType.entities:
        [this.totalLines, this.enStats] = computeAggregatedStats(
          this.projectFiles
        );
        break;
      case StatKindType.lines:
        [this.totalLines, this.liStats] = computeAggregatedStats(
          this.projectFiles
        );
        break;
    }
    this.statsPercent = computePercentages(this.totalLines, this.getStats());
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

export class Trace {
  filename: string;
  date: string;
  tag: string;

  constructor(filename: string, date: string, tag: string) {
    this.filename = filename;
    this.date = date;
    this.tag = tag;
  }
}

export class Report extends Stats implements Enumerables, Enumerable {
  projects: Project[];
  coverageLevel: string;
  totalLines: number;
  traces: Array<[string, Trace[]]>;

  constructor(data: IReport) {
    super();
    const projects: Map<string, Project> = new Map<string, Project>();
    for (const source of data.sources) {
      const key: string = source.project;
      const project: Project = projects.get(key) || new Project(key);
      project.addSource(new Source(source));
      projects.set(key, project);
    }
    for (const item of projects.entries()) {
      const project: Project = item[1];
      project.computeStats(new Set());
    }
    [this.totalLines, this.liStats] = computeAggregatedStats(
      Array.from(projects.values())
    );
    this.statsPercent = computePercentages(this.totalLines, this.liStats);
    this.projects = Array.from(projects.values());

    // if it is not a multi-project project, set a default project name because there will be none in the output data
    if (this.projects.length === 1) {
      this.projects[0].projectName = 'Other Sources';
    }
    this.coverageLevel = data.coverageLevel;

    const tracesMap: Map<string, Trace[]> = new Map<string, Trace[]>();
    data.traces.forEach((trace: ITrace) =>
      tracesMap.has(trace.program)
        ? tracesMap
            .get(trace.program)
            .push(new Trace(trace.filename, trace.date, trace.tag))
        : tracesMap.set(trace.program, [
            new Trace(trace.filename, trace.date, trace.tag),
          ])
    );
    // Do not directly use the map here, but store all the values in a <key, value> Array to avoid
    // subsequent issues with the change detection.
    this.traces = Array.from(tracesMap.entries());
  }

  getName: () => string = () => 'Total';

  getEnumerables(): Array<Enumerable> {
    return this.projects;
  }

  getHeadName(): string {
    return 'Projects';
  }

  computeStats(levels: Set<string>): void {
    this.projects.forEach((project: Project) => project.computeStats(levels));
    switch (statKind) {
      case StatKindType.entities:
        [this.totalLines, this.enStats] = computeAggregatedStats(this.projects);
        break;
      case StatKindType.lines:
        [this.totalLines, this.liStats] = computeAggregatedStats(this.projects);
        break;
    }
    this.statsPercent = computePercentages(this.totalLines, this.getStats());
  }
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  report$: Subject<Report> = new ReplaySubject<Report>();
  report: Observable<Report> = this.report$.asObservable();
  total: Observable<Enumerables>;

  constructor(private loadJSONService: LoadJsonService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: Observable<IReport> = this.loadJSONService.getJSON('report.js');
    data.subscribe((report: IReport) => this.report$.next(new Report(report)));
    this.total = this.report.pipe(
      map(
        (report: Report) =>
          new (class implements Enumerables {
            enumerable: Enumerable;

            constructor(enumerable: Enumerable) {
              this.enumerable = enumerable;
            }

            getEnumerables(): Array<Enumerable> {
              return [this.enumerable];
            }

            getHeadName(): string {
              return '';
            }
          })(report)
      )
    );
  }

  getReport(): Observable<Report> {
    return this.report;
  }

  getTotal(): Observable<Enumerables> {
    return this.total;
  }

  getCoverageLevel(): Observable<string> {
    return this.report.pipe(map((report: Report) => report.coverageLevel));
  }

  getTraces(): Observable<Iterable<[string, Trace[]]>> {
    return this.report.pipe(map((report: Report) => report.traces));
  }

  computeForLevels(levels: Set<string>): void {
    this.report.pipe(take(1)).subscribe((report: Report) => {
      report.computeStats(levels);
      this.report$.next(report);
    });
  }

  getStatsForSource(
    projectName: string,
    sourceName: string
  ): Observable<Source> {
    return this.report.pipe(
      map((report: Report) =>
        report.projects
          .find((p: Project) => p.projectName === projectName)
          .projectFiles.find((s: Source) => s.hunkFilename === sourceName)
      )
    );
  }
}
