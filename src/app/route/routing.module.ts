import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {ReportComponent} from '../report.component';
import {SourceComponent} from '../source/source/source.component';
const routes: Routes = [
  {path: '', pathMatch:'full', component: ReportComponent},
  {path: 'report', component: ReportComponent},
  {path:'sources/:sourceName:ctx', component:SourceComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
