import { Observable } from 'rxjs';
import { Status } from '../models/app-enum';

export interface Enumerable {
  total: number;
  getName(): string;
  getStats(): Record<Status, number>;
  getStatsPercent(): Record<Status, number>;
  getChildren(): Array<Enumerable>;
  setChildren(v: Array<Enumerable>): void;
}

export interface EnumerableService {
  getEnumerable(): Observable<Enumerable>;
}

export interface Enumerables {
  getEnumerables(): Array<Enumerable>;
  getHeadName(): string;
}

export interface EnumerablesService {
  getEnumerables(): Observable<Enumerables>;
}

export interface IProject {
  projectName: string;
  projectFiles: Enumerable[];
}
