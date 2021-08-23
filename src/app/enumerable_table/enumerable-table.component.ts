import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { Status } from '../../models/app-enum';
import { Enumerable, Enumerables } from '../../interface/report.model';
import { Ctx, Properties, statusProperties } from '../ctx.service';
import { Project, statKind, StatKindType } from '../report.service';

@Component({
  selector: 'app-enumerable-table',
  templateUrl: './enumerable-table.component.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EnumerableTableComponent implements OnInit {
  // loading is faster when inputting the context instead of using the CtxService in class constructor
  // i have no explanation to that, investigate
  @Input() ctx: Ctx;
  @Input() project: Enumerables;
  @Input() isSource: boolean;

  public sortedData: Array<Enumerable>;
  public totalLines: number;
  statusProperties: Record<Status, Properties> = statusProperties;

  // if isSource is True, then project is a Project object, which means we
  // have a project name, which we want to pass on.
  projectName: string;

  ngOnInit(): void {
    this.sortedData = this.project.getEnumerables();
    if (this.isSource) {
      this.projectName = (this.project as Project).projectName;
    }
  }

  getIndexClass(index: number): string {
    return index % 2 === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
  }

  sortData(sort: Sort): void {
    const data: Enumerable[] = this.sortedData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a: Enumerable, b: Enumerable) => {
      const isAsc: boolean = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return compare(a.getName(), b.getName(), isAsc);
        case 'totalLines':
          return compare(a.totalLines, b.totalLines, isAsc);
        default:
          const status: string = sort.active;
          return Status[status] !== undefined
            ? compare(a.getStats()[status], b.getStats()[status], isAsc)
            : 0;
      }
    });
  }

  getTotalLabel(): string {
    switch (statKind) {
      case StatKindType.entities:
        return 'Total obligations';
      case StatKindType.lines:
        return 'Total lines';
    }
  }
}

function compare(
  a: number | string,
  b: number | string,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
