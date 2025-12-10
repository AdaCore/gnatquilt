import { Component, Input, ViewEncapsulation } from '@angular/core';
import { InstructionSet } from '../../../../../interface/data.model';
import {
  Properties,
  statusProperties,
  symbolToStat,
} from '../../../../ctx.service';
import { Status } from '../../../../../models/app-enum';
import { NgTemplateOutlet } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-instruction-set',
  templateUrl: './instruction-set.component.html',
  styleUrls: ['../../../style.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, MatTooltip],
})
export class InstructionSetComponent {
  @Input() instructionSet: InstructionSet;

  getCoverageStatus(symbol: string): Status {
    return symbolToStat.get(symbol);
  }

  getProperties(status: Status): Properties {
    return statusProperties[status];
  }

  toHex(decimal: string): string {
    return '0x' + parseInt(decimal, 16);
  }
}
