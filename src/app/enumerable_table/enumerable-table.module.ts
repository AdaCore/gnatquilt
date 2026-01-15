import { EnumerableTableComponent } from './enumerable-table.component';
import { EnumerableInfoComponent } from './enumerable-info.component';
import { SummaryComponent } from './summary.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { RoutingModule } from '../route/routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    MatSortModule,
    MatExpansionModule,
    RoutingModule,
    MatCheckboxModule,
    FormsModule,
    MatIconModule,
    EnumerableTableComponent,
    EnumerableInfoComponent,
    SummaryComponent,
  ],
  providers: [],
  exports: [EnumerableTableComponent],
})
export class EnumerableTableModule {}
