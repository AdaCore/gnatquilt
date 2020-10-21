import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {ReportComponent} from '../report.component';
import {SourceFileComponent} from '../source/source-file/source-file.component';
const routes: Routes = [
  {path: '', pathMatch:'full', component: ReportComponent},
  {path: 'report', component: ReportComponent},
  {path:'sources/:sourceName', component:SourceFileComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
