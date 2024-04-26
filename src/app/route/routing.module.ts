import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportComponent } from '../report.component';
import { SourceFileComponent } from '../source/source-file/source-file.component';
import { TraceMenuComponent } from '../trace-menu/trace-menu.component';

export const routes: Routes = [
  { path: '', redirectTo: '/report', pathMatch: 'full' },
  { path: 'report', pathMatch: 'full', component: ReportComponent },
  { path: 'traces', component: TraceMenuComponent },
  { path: 'sources/:projectName/:sourceName', component: SourceFileComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class RoutingModule {}
