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
  stats: Record<Status, number>;
  hunkFilename: string;
  missingSource: boolean;
  project: string;
}

export type LowerRange = [number, number];
export type UpperRange = [number, number];

export type Range = [LowerRange, UpperRange];

/**
 * the string representation of a range
 *
 * @param lowerOrUpper 0: print lower range, 1: print upper range
 * @return string representation of the range
 */
export function strLowOrUp(range: Range, lowerOrUpper: 0 | 1): string{
  return range[lowerOrUpper][0].toString() + ':' + range[lowerOrUpper][1].toString();
}



export interface Line {
  lineNumber: string;
  exempted: string;
  src: string;
}

export interface Message {
  kind: string;
  sco: string;
  message: string;
}

export interface Statement {
  id: string;
  text: string;
  coverage: string;
  range: Range;
}

export interface Condition {
  id: string;
  text: string;
  coverage: string;
  range: Range;
}

export interface Decision {
  id: string;
  text: string;
  coverage: string;
  range: Range;
  conditions: Condition[];
}

export interface Mapping {
  coverage: string;
  line: Line;
  message: Message;
  statements: Statement[];
  decisions: Decision[];
}

export interface ISourceAnnotated extends ISource {
  mappings: Mapping[];
}

export interface IReport {
  coverageLevel: string;
  traces: any;
  sources: Array<ISource>;
}
