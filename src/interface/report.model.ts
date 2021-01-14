import {Observable} from 'rxjs';
import {Status} from '../models/app-enum';

export interface Enumerable{
  totalLines: number;
  stats: Record<Status, number>;
  statsPercent: Record<Status, number>;
  getName(): string;
}

export interface EnumerableService{
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
