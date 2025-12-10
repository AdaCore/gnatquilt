import { SourceLineComponent } from './source-line/source-line.component';
import { SourceFileComponent } from './source-file/source-file.component';
import { MessageComponent } from './source-line/attached/message/message.component';
import { InstructionSetComponent } from './source-line/attached/instruction-set/instruction-set.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { EnumerableTableModule } from '../enumerable_table/enumerable-table.module';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { VirtualScrollerModule } from './source-file/virtual-scroller';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    MatSortModule,
    MatExpansionModule,
    MatCheckboxModule,
    FormsModule,
    VirtualScrollerModule,
    EnumerableTableModule,
    MatIconModule,
    RouterModule,
    SourceFileComponent,
    SourceLineComponent,
    MessageComponent,
    InstructionSetComponent,
  ],
  exports: [SourceFileComponent],
})
export class SourceFileModule {}
