import {EnumerableTableComponent} from './enumerable-table.component';
import {EnumerableInfoComponent} from './enumerable-info.component';
import {SummaryComponent} from './summary.component';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {MatSortModule} from '@angular/material/sort';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatExpansionModule} from '@angular/material/expansion';
import {RoutingModule} from '../route/routing.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [
    EnumerableTableComponent,
    EnumerableInfoComponent,
    SummaryComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatExpansionModule,
    RoutingModule,
    MatCheckboxModule,
    FormsModule
  ],
  providers: [],
  exports: [
    EnumerableTableComponent
  ]
})
export class EnumerableTableModule { }
