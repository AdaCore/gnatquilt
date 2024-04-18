import { Status } from '../models/app-enum';

export interface EntityStats {
  level: string;
  stats: Record<Status, number>;
}

export interface ISource {
  filename: string;
  // computed metrics for the file, either line, or coverage entity (stmt,
  // decision, ...) oriented.
  liStats: Record<Status, number>;
  enAllStats: Array<EntityStats>;
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
export function strLowOrUp(range: Range, lowerOrUpper: 0 | 1): string {
  return (
    range[lowerOrUpper][0].toString() + ':' + range[lowerOrUpper][1].toString()
  );
}

export interface Line {
  lineNumber: string;
  exempted: string;
  src: string;
}

export interface Instruction {
  address: string;
  coverage: string;
  assembly: string;
}

export interface InstructionBlock {
  name: string;
  offset: string;
  coverage: string;
  instructions: Instruction[];
}

export interface InstructionSet {
  coverage: string;
  instructionBlocks: InstructionBlock[];
}

export interface Message {
  kind: string;
  sco: string;
  message: string;
}

export interface AnnotatedSCO {
  id: string;
  text: string;
  coverage: string;
  range: Range;
  annotations: string[];
}
export type Statement = AnnotatedSCO;

export type Condition = AnnotatedSCO;

export interface Decision extends AnnotatedSCO {
  conditions: Condition[];
}

export interface Mapping {
  coverage: string;
  line: Line;
  messages: Message[];
  statements: Statement[];
  decisions: Decision[];
  instructionSet: InstructionSet;
}

export interface IScopeMetrics {
  scopeName: string;
  scopeLine: number;
  children: Array<IScopeMetrics>;
  stats: Record<Status, number>;
  enAllStats: Array<EntityStats>;
}

export interface ISourceAnnotated extends ISource {
  language: string;
  scopeMetrics: IScopeMetrics;
  mappings: Mapping[];
}

export interface ITrace {
  filename: string;
  kind: string;
  program: string;
  date: string;
  tag: string;
}

export interface IReport {
  coverageLevel: string;
  traces: ITrace[];
  sources: ISource[];
}
