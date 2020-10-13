import {Component, Input, OnInit} from '@angular/core';
import {Sort} from '@angular/material/sort';
import {Status} from '../../models/app-enum';
import {Enumerable, Enumerables} from '../../interface/report.model';
import {Ctx} from '../report.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnInit {
  @Input() ctx: Ctx;
  @Input() project: Enumerables;

  public sortedData: Array<Enumerable>;
  public totalLines: number;

  ngOnInit(): void {
    this.sortedData = this.project.getEnumerables();
  }

  sortData(sort: Sort): void {
    const data = this.sortedData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
      case 'name':
        return compare(a.getName(), b.getName(), isAsc);
      case 'totalLines':
        return compare(a.totalLines, b.totalLines, isAsc);
      default:
        const status = sort.active;
        console.log(status);
        console.log(Status[status]);
        return Status[status] !== undefined ?
          compare(a.stats.get(status), b.stats.get(status), isAsc) :
          0;
      }
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

