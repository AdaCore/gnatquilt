import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IReport, ISource} from '../../../interface/data.model';
import {Enumerable, Enumerables} from '../../../interface/report.model';
import {fromPromise} from 'rxjs/internal-compatibility';

export interface ISourceFile extends ISource {
  mappings: any;
}

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.css']
})

export class SourceComponent implements OnInit {

  ngOnInit(): void {
  }

}
