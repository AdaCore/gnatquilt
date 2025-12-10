import { Enumerable, Enumerables } from '../interface/report.model';
import { EntityStats, IReport, ISource, ITrace } from '../interface/data.model';
import { initStatus, Status } from '../models/app-enum';
import { Injectable, inject } from '@angular/core';
import { LoadJsonService } from './load-json.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

/**
 * computes the percentage statistics from statistics and total number of lines
 *
 * @param total total number of lines
 * @param stats statistics that give for each status the number of lines
 * @return percentage stats
 */
export function computePercentages(
  total: number,
  stats: Record<Status, number>
): Record<Status, number> {
  const percentages: Record<Status, number> = initStatus();
  for (const [status, covStat] of Object.entries(stats)) {
    // Avoid rounding around the extremes, and output 100% coverage only
    // when all the lines / obligations are covered, and output 0% when
    // none of them are.

    if (total !== 0) {
      percentages[status] = Math.round((100 * covStat) / total);
      if (percentages[status] === 100 && covStat !== total) {
        percentages[status] = 99;
      }
      if (percentages[status] === 0 && covStat !== 0) {
        percentages[status] = 1;
      }
    } else {
      percentages[status] = 0;
    }
  }
  return percentages;
}

/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param aggregate: list of enumerable, i.e. object that have total and stats properties
 * @return [aggregated total number of lines, aggregated statistics]
 */
export function computeAggregatedStats(
  aggregate: Enumerable[]
): [number, Record<Status, number>] {
  const total: number = aggregate
    .map((enumerable: Enumerable) => enumerable.total)
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
  return [total, stats];
}
/**
 * aggregates stats from a list of object with stats (enumerable)
 *
 * @param enAllStats: entities stats, i.e. coverage obligations stats for each coverage level
 * @param levels: list of level strings for which we want to compute stats aggregation
 * @return [aggregated total number of coverage obligations, aggregated statistics]
 */
export function aggregateEntitiesStats(
  enAllStats: EntityStats[],
  levels: Set<string>
): [number, Record<Status, number>] {
  const enStats: Record<Status, number> = initStatus();

  let total = 0;
  enAllStats.forEach((entity: EntityStats) => {
    if (levels.has(entity.level)) {
      for (const [status, _stat] of Object.entries(entity.stats)) {
        enStats[status] += entity.stats[status];
        total += entity.stats[status];
      }
    }
  });
  return [total, enStats];
}

export enum StatKindType {
  entities,
  lines,
}
export let statKind: StatKindType = StatKindType.lines;
export function setStatKind(setKind: StatKindType): void {
  statKind = setKind;
}

export abstract class Stats implements Enumerable {
  stats: Record<Status, number> = initStatus();
  statsPercent: Record<Status, number> = initStatus();
  total = 0;

  getStats(): Record<Status, number> {
    return this.stats;
  }

  getStatsPercent(): Record<Status, number> {
    return this.statsPercent;
  }

  abstract getName(): string;
  abstract getChildren(): Enumerable[];
  abstract setChildren(v: Enumerable[]): void;
}

export abstract class StatsWithEnStats extends Stats implements Enumerable {
  // This implements entity metrics reporting. enAllStats contains statistics
  // for every metric (e.g. statement, decision ...), as opposed to enStats
  // which contains statistics for the currently selected metric.
  enAllStats: EntityStats[];
  enStats: Record<Status, number>;

  // This implements line metrics reporting.
  liStats: Record<Status, number>;

  constructor(enAllStats: EntityStats[]) {
    super();
    this.enAllStats = enAllStats;
  }

  getStats(): Record<Status, number> {
    switch (statKind) {
      case StatKindType.entities:
        return this.enStats;
      case StatKindType.lines:
        return this.liStats;
    }
  }

  computeLines(stats: Record<Status, number>): number {
    let total = Object.values(stats).reduce(
      (sum: number, current: number) => sum + current
    );
    total -= stats.noCode || 0;
    return total;
  }

  computeStats(levels: Set<string>): void {
    switch (statKind) {
      case StatKindType.lines:
        this.total = Object.values(this.liStats).reduce(
          (sum: number, current: number) => sum + current
        );
        this.total -= this.liStats.noCode || 0;
        break;
      case StatKindType.entities:
        [this.total, this.enStats] = aggregateEntitiesStats(
          this.enAllStats,
          levels
        );
        break;
    }
    this.statsPercent = computePercentages(this.total, this.getStats());
  }
}

// This implements coverage reporting for a specific source. It is used both in
// in the index view and in the source file view.
export class Source extends StatsWithEnStats implements ISource, Enumerable {
  filename: string;
  hunkFilename: string;
  missingSource: boolean;
  project: string;

  constructor(source: ISource) {
    super(source.enAllStats);
    this.filename = source.filename;
    this.hunkFilename = source.hunkFilename;
    this.missingSource = source.missingSource;
    this.project = source.project;
    this.liStats = source.liStats;
    this.total = this.computeLines(this.liStats);
    this.statsPercent = computePercentages(this.total, this.liStats);
    this.missingSource = source.missingSource;
  }

  getName(): string {
    return this.filename;
  }

  getHunkFilename(): string {
    return this.hunkFilename;
  }

  getChildren(): Enumerable[] {
    return [];
  }

  override setChildren(_: Enumerable[]): void {}
}

// This implements coverage reporting for a specific project, see the
// <project_name> section in the index view for a project named
// <project_name>.gpr.
export class Project extends Stats implements Enumerable, Enumerables {
  total: number;
  sources: Source[] = [];

  constructor(public projectName: string) {
    super();
    this.projectName = projectName;
  }

  addSource(source: Source): void {
    this.sources.push(source);
  }

  computeStats(levels: Set<string>): void {
    this.sources.forEach((s: Source) => {
      s.computeStats(levels);
    });
    [this.total, this.stats] = computeAggregatedStats(this.sources);
    this.statsPercent = computePercentages(this.total, this.getStats());
  }

  getName(): string {
    return this.projectName;
  }

  getEnumerables(): Enumerable[] {
    return this.sources;
  }

  getChildren(): Enumerable[] {
    return [];
  }

  override setChildren(_: Enumerable[]): void {}

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

// This implements the coverage reporting for the whole project tree, see the
// Overview section in the index view.
export class Report extends Stats implements Enumerables, Enumerable {
  projects: Project[];
  coverageLevel: string;
  total: number;
  traces: [string, Trace[]][];

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
    [this.total, this.stats] = computeAggregatedStats(
      Array.from(projects.values())
    );
    this.statsPercent = computePercentages(this.total, this.stats);
    this.projects = Array.from(projects.values());
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
    // Do not directly use the map here, but store all the values in a
    // <key, value> Array to avoid subsequent issues with the change detection.
    this.traces = Array.from(tracesMap.entries());
  }

  getName: () => string = () => 'Total';

  getEnumerables(): Enumerable[] {
    return this.projects;
  }

  getHeadName(): string {
    return 'Projects';
  }

  computeStats(levels: Set<string>): void {
    this.projects.forEach((project: Project) => project.computeStats(levels));
    [this.total, this.stats] = computeAggregatedStats(this.projects);
    this.statsPercent = computePercentages(this.total, this.getStats());
  }

  getChildren(): Enumerable[] {
    return [];
  }

  override setChildren(_: Enumerable[]): void {}
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private loadJSONService = inject(LoadJsonService);

  report$: Subject<Report> = new ReplaySubject<Report>();
  report: Observable<Report> = this.report$.asObservable();
  total: Observable<Enumerables>;
  levelStats: Set<string> = new Set<string>();
  levelStatsUpdated: Subject<Set<string>> = new Subject<Set<string>>();

  constructor() {
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

            getEnumerables(): Enumerable[] {
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

  getLevelStats(): Set<string> {
    return this.levelStats;
  }

  computeLevelStats(levels: Set<string>): void {
    this.report.pipe(take(1)).subscribe((report: Report) => {
      report.computeStats(levels);
      this.report$.next(report);
    });
  }

  updateLevelStats(levels: Set<string>): void {
    this.levelStats = levels;
    this.levelStatsUpdated.next(levels);
  }

  getStatsForSource(
    projectName: string,
    sourceName: string
  ): Observable<Source> {
    return this.report.pipe(
      map((report: Report) =>
        report.projects
          .find((p: Project) => p.projectName === projectName)
          .sources.find((s: Source) => s.hunkFilename === sourceName)
      )
    );
  }
}
