import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Enumerable } from '../../interface/report.model';
import { Ctx, Properties, statusProperties } from '../ctx.service';
import { Status } from '../../models/app-enum';
import { Source } from '../report.service';

@Component({
  selector: 'app-enumerable-info, [app-enumerable-info]',
  templateUrl: './enumerable-info.component.html',
  styleUrls: ['./style.scss'],
  // if removed, shadows parent style
  encapsulation: ViewEncapsulation.None,
})
export class EnumerableInfoComponent implements OnInit {
  @Input() enumerable: Enumerable;

  @Input() ctx: Ctx;

  @Input() isSource: boolean;

  // The summary part of the HTML report gives a view of the sources of the project
  // arborescence. Each source is attached to the project it belongs to, and
  // we rely on this information (the source name + the project name) to then
  // load the right source when the user wants to visit it. Note that this is
  // necessary as a filename may not be unique across the arborescence,
  // especially with projects having C sources.
  @Input() projectName: string;

  // Children enumerables are printed with an offset padding. The margin tracks
  // this offset.
  @Input() margin: number;

  // whether the designated enumerable is a leaf (i.e. has no children
  // enumerables).
  @Input() isLeaf: boolean;

  @Output() clickedOnEnumerable = new EventEmitter<Enumerable>();

  @Output() expanded = new EventEmitter<Enumerable>();
  @Output() collapsed = new EventEmitter<Enumerable>();
  isExpanded = false;

  statusProperties: Record<Status, Properties> = statusProperties;

  getHunkFilename(enumerable: Enumerable): string {
    const source: Source = enumerable as Source;
    return source.getHunkFilename();
  }

  ngOnInit(): void {}

  getStat(e: Enumerable, status: string): number {
    return e.getStats()[status] as number;
  }

  clickOnEnumerable(): void {
    this.clickedOnEnumerable.emit(this.enumerable);
  }

  expand(): void {
    this.isExpanded = true;
    this.expanded.emit(this.enumerable);
  }

  collapse(): void {
    this.isExpanded = false;
    this.collapsed.emit(this.enumerable);
  }
}
