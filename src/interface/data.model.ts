import {Status} from '../models/app-enum';

export interface ITrace{
  filename: string;
  kind: string;
  program: string;
  date: string;
  tag: string;
}

export interface ISource {
  filename: string;
  /* an object with status properties ({covered: 1, not_covered: 1 ...})
     */
  stats: {[status in keyof typeof Status]: number};
  hunkFilename: string;
  missingSource: boolean;
  project: string;
}

export interface IReport {
  coverageLevel: string;
  traces: any;
  sources: Array<ISource>;
}
