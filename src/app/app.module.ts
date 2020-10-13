import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {AppComponent, ChildComponent} from './app.component';
import {SummaryComponent} from './source_table/summary.component';
import {TableComponent} from './source_table/table.component';
import {ReportComponent} from './report.component';
import {SourceInfoComponent} from './source_table/source-info.component';
import {MatTooltip, MatTooltipModule} from '@angular/material/tooltip';
import {MatSliderModule} from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatSortModule} from '@angular/material/sort';
import {MatExpansionModule} from '@angular/material/expansion';

@NgModule({
  declarations: [
    AppComponent,
    ChildComponent,
    SummaryComponent,
    TableComponent,
    ReportComponent,
    SourceInfoComponent
  ],
  imports: [
    BrowserModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatExpansionModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
