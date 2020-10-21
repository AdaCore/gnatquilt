import {Component, Input, OnInit} from '@angular/core';
import {Sort} from '@angular/material/sort';
import {Status} from '../../models/app-enum';
import {Enumerable, Enumerables} from '../../interface/report.model';
import {Ctx, CtxService, Properties} from '../ctx.service';
import {statusProperties} from '../ctx.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnInit {

  // loading is faster when inputting the context instead of using the CtxService in class constructor
  // i have no explanation to that, investigate
  @Input() ctx: Ctx;
  @Input() project: Enumerables;

  public sortedData: Array<Enumerable>;
  public totalLines: number;
  statusProperties: Record<Status, Properties> = statusProperties;

  ngOnInit(): void {
    this.sortedData = this.project.getEnumerables();
  }

  getIndexClass(index: number): string {
    return (index % 2) === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
  }

  sortData(sort: Sort): void {
    const data: Enumerable[] = this.sortedData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc: boolean = sort.direction === 'asc';
      switch (sort.active) {
      case 'name':
        return compare(a.getName(), b.getName(), isAsc);
      case 'totalLines':
        return compare(a.totalLines, b.totalLines, isAsc);
      default:
        const status: string = sort.active;
        console.log(status);
        console.log(Status[status]);
        return Status[status] !== undefined ?
          compare(a.stats[status], b.stats[status], isAsc) :
          0;
      }
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

