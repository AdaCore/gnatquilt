import {Enumerable, Enumerables, IStats} from '../interface/report.model';
import {IReport, ISource} from '../interface/data.model';
import {Status} from '../models/app-enum';

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
    console.log(totalLines);
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
  projects: Map<string, Project> = new Map<string, Project>();
  totalLines: number;
  stats: Map<string, number>;
  statsPercent: Map<string, number>;

  constructor(data: IReport) {
    for (const source of data.sources) {
      const key = source.project;
      const project = this.projects.get(key) || new Project(key);
      project.addSource(new Source(source));
      this.projects.set(key, project);
    }
    for (const item of this.projects.entries()){
      const project = item[1];
      project.computeStats();
    }
    [this.totalLines, this.stats] = computeAggregatedStats(Array.from(this.projects.values()));
    this.statsPercent = computePercentages(this.totalLines, this.stats);
  }

  getName = () => 'Total';

  getEnumerables(): Array<Enumerable> {
    return Array.from(this.projects.values());
  }

  getHeadName(): string {
    return 'Projects';
  }
}

export class StatusWihProperties {
  status: Status;
  name: string;
  classSuffix: string;
}

export class Ctx {
  properties: Array<StatusWihProperties>;
  width: number;

  constructor(aggregatedStats: Enumerable){
    this.properties = this.propertiesOfInterest(aggregatedStats);
    this.width = this.computeWidth(this.properties);
    console.log(this.width);
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
