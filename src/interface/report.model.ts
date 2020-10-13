export interface IStats {
  totalLines: number;
  stats: Map<string, number>;
  statsPercent: Map<string, number>;
}

export interface Enumerable{
  totalLines: number;
  stats: Map<string, number>;
  statsPercent: Map<string, number>;
  getName(): string;
}

export interface Enumerables {
  getEnumerables(): Array<Enumerable>;
  getHeadName(): string;
}

export interface IProject {
  projectName: string;
  projectFiles: Enumerable[];
}
