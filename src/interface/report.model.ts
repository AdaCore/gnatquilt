import { Observable } from 'rxjs';
import { Status } from '../models/app-enum';

export interface Enumerable {
  totalLines: number;
  getName(): string;
  getStats(): Record<Status, number>;
  getStatsPercent(): Record<Status, number>;
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
