import { SourceLineComponent } from './source-line/source-line.component';
import { SourceFileComponent } from './source-file/source-file.component';
import { MessageComponent } from './source-line/attached/message/message.component';
import { InstructionSetComponent } from './source-line/attached/instruction-set/instruction-set.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { EnumerableTableModule } from '../enumerable_table/enumerable-table.module';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { VirtualScrollerModule } from './source-file/virtual-scroller';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

@NgModule({
  declarations: [
    SourceFileComponent,
    SourceLineComponent,
    MessageComponent,
    InstructionSetComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatExpansionModule,
    MatCheckboxModule,
    FormsModule,
    VirtualScrollerModule,
    EnumerableTableModule,
    MatIconModule,
    RouterModule,
    HighlightModule,
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          ada: () => import('highlight.js/lib/languages/ada'),
          cpp: () => import('highlight.js/lib/languages/cpp'),
        },
      },
    },
  ],
  exports: [SourceFileComponent],
})
export class SourceFileModule {}
