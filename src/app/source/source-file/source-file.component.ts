import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IReport, ISource, ISourceAnnotated} from '../../../interface/data.model';
import {Enumerable, Enumerables} from '../../../interface/report.model';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Report, ReportService} from '../../report.service';
import {Ctx, CtxService} from '../../ctx.service';
import {AnnotatedSource, SourceFileService} from './source-file.service';
import {Observable, zip} from 'rxjs';
import {map} from 'rxjs/operators';

export interface ISourceFile extends ISource {
  mappings: any;
}

@Component({
  selector: 'app-source',
  templateUrl: './source-file.component.html',
  styleUrls: ['./source-file.component.scss'],
  providers: [SourceFileService],
  encapsulation: ViewEncapsulation.None
})

export class SourceFileComponent implements OnInit {
  source$: Observable<AnnotatedSource>;
  ctx$: Observable<Ctx>;
  data$: Observable<{ctx: Ctx; source: AnnotatedSource}>;

  constructor(private ctxService: CtxService, private sourceService: SourceFileService){
    this.source$ = sourceService.getSource();
    this.ctx$ = ctxService.getCtx();
    this.data$ = zip(this.ctx$, this.source$)
      .pipe(
        map(([ctx, source]: [Ctx, AnnotatedSource]) =>
          ({ctx, source})));
  }

  ngOnInit(): void {
  }

}
