import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
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
  standalone: false,
})
export class EnumerableTableComponent implements OnInit {
  // loading is faster when inputting the context instead of using the CtxService in class constructor
  // i have no explanation to that, investigate
  @Input() ctx: Ctx;
  @Input() project: Enumerables;
  @Input() isSource: boolean;
  @Output() clickedOnEnumerable = new EventEmitter<Enumerable>();

  public sortedData: Array<Enumerable>;
  public total: number;
  statusProperties: Record<Status, Properties> = statusProperties;

  // if isSource is True, then project is a Project object, which means we
  // have a project name, which we want to pass on.
  projectName: string;

  // Track the expanded sub-metrics
  expandedSubMetrics: Set<Enumerable> = new Set<Enumerable>();

  public constructor(private cd: ChangeDetectorRef) {}

  checkChanges(): void {
    this.cd.markForCheck();
  }

  ngOnInit(): void {
    this.sortedData = this.project.getEnumerables();
    if (this.isSource) {
      this.projectName = (this.project as Project).projectName;
    }
  }

  sortData(sort: Sort): void {
    const data: Enumerable[] = this.sortedData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    function sortEnum(data: Enumerable[]): Enumerable[] {
      for (const e of data) {
        if (e.getChildren().length > 0) {
          e.setChildren(sortEnum(e.getChildren()));
        }
      }
      return data.sort((a: Enumerable, b: Enumerable) => {
        const isAsc: boolean = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return compare(a.getName(), b.getName(), isAsc);
          case 'total':
            return compare(a.total, b.total, isAsc);
          default:
            const status: string = sort.active;
            return Status[status] !== undefined
              ? compare(a.getStats()[status], b.getStats()[status], isAsc)
              : 0;
        }
      });
    }
    this.sortedData = sortEnum(data);
  }

  getTotalLabel(): string {
    switch (statKind) {
      case StatKindType.entities:
        return 'Total obligations';
      case StatKindType.lines:
        return 'Total lines';
    }
  }

  clickOnEnumerable(enumerable: Enumerable): void {
    this.clickedOnEnumerable.emit(enumerable);
  }

  expand(e: Enumerable): void {
    this.expandedSubMetrics.add(e);
  }

  collapse(e: Enumerable): void {
    this.expandedSubMetrics.delete(e);
  }

  isExpanded(e: Enumerable): boolean {
    return this.expandedSubMetrics.has(e);
  }
}

function compare(
  a: number | string,
  b: number | string,
  isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
