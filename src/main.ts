import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import {
  APP_BASE_HREF,
  LocationStrategy,
  HashLocationStrategy,
  CommonModule,
} from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './app/route/custom-route-reuse-strategy';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { RoutingModule } from './app/route/routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { ScriptLoaderModule } from 'ngx-script-loader';
import { SourceFileModule } from './app/source/source-file.module';
import { EnumerableTableModule } from './app/enumerable_table/enumerable-table.module';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      CommonModule,
      MatButtonModule,
      MatButtonToggleModule,
      MatTooltipModule,
      MatSortModule,
      MatExpansionModule,
      RoutingModule,
      MatCheckboxModule,
      FormsModule,
      ScriptLoaderModule,
      SourceFileModule,
      EnumerableTableModule,
      MatIconModule
    ),
    { provide: APP_BASE_HREF, useValue: './' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: RouteReuseStrategy,
      useClass: CustomReuseStrategy,
    },
  ],
}).catch((err) => console.error(err));
