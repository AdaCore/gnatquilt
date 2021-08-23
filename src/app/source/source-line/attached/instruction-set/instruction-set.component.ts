import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { InstructionSet } from '../../../../../interface/data.model';
import {
  Properties,
  statusProperties,
  symbolToStat,
} from '../../../../ctx.service';
import { Status } from '../../../../../models/app-enum';

@Component({
  selector: 'app-instruction-set',
  templateUrl: './instruction-set.component.html',
  styleUrls: ['../../../style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InstructionSetComponent implements OnInit {
  @Input() instructionSet: InstructionSet;

  constructor() {}

  getCoverageStatus(symbol: string): Status {
    return symbolToStat.get(symbol);
  }

  getProperties(status: Status): Properties {
    return statusProperties[status];
  }

  toHex(decimal: string): string {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return '0x' + parseInt(decimal, 16);
  }

  ngOnInit(): void {}
}
