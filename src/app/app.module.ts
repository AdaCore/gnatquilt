import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {SummaryComponent} from './source_table/summary.component';
import {TableComponent} from './source_table/table.component';
import {ReportComponent} from './report.component';
import {SourceInfoComponent} from './source_table/source-info.component';
import {MatTooltip, MatTooltipModule} from '@angular/material/tooltip';
import {MatSliderModule} from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatSortModule} from '@angular/material/sort';
import {MatExpansionModule} from '@angular/material/expansion';
import { SourceComponent } from './source/source/source.component';
import { RoutingModule } from './route/routing.module';
import {CommonModule} from '@angular/common';
import {AppComponent} from './app.component';
import {RouteReuseStrategy} from '@angular/router';
import {CustomRouteReuseStrategy} from './route/custom-route-reuse-strategy';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    SummaryComponent,
    TableComponent,
    ReportComponent,
    SourceInfoComponent,
    SourceComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatExpansionModule,
    RoutingModule
  ],
  providers: [{
    provide: RouteReuseStrategy,
    useClass: CustomRouteReuseStrategy
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
