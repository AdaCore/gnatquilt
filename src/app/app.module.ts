import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReportComponent } from './report.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { RoutingModule } from './route/routing.module';
import {
  APP_BASE_HREF,
  CommonModule,
  HashLocationStrategy,
  LocationStrategy,
} from '@angular/common';
import { AppComponent } from './app.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './route/custom-route-reuse-strategy';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SourceFileModule } from './source/source-file.module';
import { EnumerableTableModule } from './enumerable_table/enumerable-table.module';
import { TraceMenuComponent } from './trace-menu/trace-menu.component';
import { ScriptLoaderModule } from 'ngx-script-loader';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [AppComponent, ReportComponent, TraceMenuComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatExpansionModule,
    RoutingModule,
    MatCheckboxModule,
    FormsModule,
    ScriptLoaderModule,
    SourceFileModule,
    EnumerableTableModule,
    MatIconModule,
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: './' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: RouteReuseStrategy,
      useClass: CustomReuseStrategy,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
