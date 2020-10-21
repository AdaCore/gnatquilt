import {AfterViewInit, Component, HostListener, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {Mapping} from '../../../interface/data.model';
import {statusProperties} from '../../ctx.service';

@Component({
  selector: 'app-source-line, [app-source-line]',
  templateUrl: './source-line.component.html',
  styleUrls: ['./source-line.component.scss'],

  encapsulation: ViewEncapsulation.None
})
export class SourceLineComponent implements OnInit {

  @Input() mapping: Mapping;
  @Input() index: number;

  statusProperties = statusProperties;
  isExpanded = false;
  classExpanded = '';

  constructor() { }

  ngOnInit(): void {}

  toggle(): void{
    if (this.mapping.message !== undefined) {
      this.isExpanded = !this.isExpanded;
      this.classExpanded = this.isExpanded ? 'xcov-source-line-expanded' : '';
    }
  }

  getIndexClass(): string {
    return (this.index % 2) === 0 ? 'xcov-table-row-even' : 'xcov-table-row-odd';
  }
}
