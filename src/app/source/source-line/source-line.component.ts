import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Mapping } from '../../../interface/data.model';
import { statusProperties, symbolToStat } from '../../ctx.service';
import { Status } from '../../../models/app-enum';

@Component({
  selector: 'app-source-line, [app-source-line]',
  templateUrl: './source-line.component.html',
  styleUrls: ['../style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SourceLineComponent implements OnInit {
  @Input() mapping: Mapping;
  @Input() isExpanded: boolean;

  @Output() expand = new EventEmitter<this>();
  @Output() collapse = new EventEmitter<any>();

  statusProperties = statusProperties;
  coverageStatus: Status;
  coverageClass: string;
  coverageClassLowlight: string;
  classExpanded = '';
  onClick: () => void;

  ngOnInit(): void {
    this.coverageStatus = symbolToStat.get(this.mapping.coverage);
    this.coverageClass =
      'xcov-source-line' + statusProperties[this.coverageStatus].classSuffix;
    this.coverageClassLowlight = this.coverageClass + '-lowlight';
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.onClick = this.hasAttached() ? this.expandOrCollapse : () => {};
    if (this.hasAttached()) {
      if (this.isExpanded) {
        this.isExpanded = true;
        this.classExpanded = 'xcov-source-line-expanded';
      }
    }
  }

  collapseAttached(): void {
    this.isExpanded = false;
    this.classExpanded = '';
    this.collapse.emit(this);
  }

  expandAttached(): void {
    this.expand.emit(this);
    this.isExpanded = true;
    this.classExpanded = 'xcov-source-line-expanded';
  }

  expandOrCollapse(): void {
    if (this.isExpanded) {
      this.collapseAttached();
    } else {
      this.expandAttached();
    }
  }

  hasAttached(): boolean {
    return (
      this.mapping.messages.length !== 0 ||
      this.mapping.instructionSet !== undefined
    );
  }

  hasMessage(): boolean {
    return this.mapping.messages.length !== 0;
  }

  getLineno(): string {
    return this.mapping.line.lineNumber;
  }
}
