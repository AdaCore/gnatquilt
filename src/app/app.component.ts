import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportService, setStatKind, StatKindType } from './report.service';
import { Router, Scroll, RouterOutlet } from '@angular/router';
import { delay, filter } from 'rxjs/operators';
import { ViewportScroller, NgClass, AsyncPipe } from '@angular/common';
import hljs from 'highlight.js';
import ada from 'highlight.js/lib/languages/ada';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, NgClass, RouterOutlet, AsyncPipe],
})
export class AppComponent {
  private reportService = inject(ReportService);

  title = 'gnatquilt';
  coverageLevel$: Observable<string>;
  allLevels = new Set<string>();

  levelsClicked = new Set<string>();
  linesClicked = true;
  constructor() {
    const router = inject(Router);
    const viewportScroller = inject(ViewportScroller);
    const reportService = this.reportService;

    hljs.registerLanguage('ada', ada);
    hljs.registerLanguage('c', c);
    hljs.registerLanguage('cpp', cpp);
    router.events
      .pipe(filter((e): e is Scroll => e instanceof Scroll))
      .pipe(delay(0))
      .subscribe((e) => {
        if (e.position) {
          // backward navigation
          viewportScroller.scrollToPosition(e.position);
        } else if (e.anchor) {
          // anchor navigation
          viewportScroller.scrollToAnchor(e.anchor);
        }
      });
    this.coverageLevel$ = reportService.getCoverageLevel();
    this.coverageLevel$.subscribe((coverageLevel: string) => {
      // It is important that all the level strings in allLevels actually
      // correspond to the level strings emitted in the JS file produced
      // by gnatcov.

      if (coverageLevel.includes('stmt')) {
        this.allLevels.add('Stmt');
        if (coverageLevel.includes('decision')) {
          this.allLevels.add('Decision');
        }
        if (coverageLevel.includes('mcdc')) {
          this.allLevels.add('Decision');
          this.allLevels.add('MCDC');
        }
        if (coverageLevel.includes('uc_mcdc')) {
          this.allLevels.add('Decision');
          this.allLevels.add('UC_MCDC');
        }
        if (coverageLevel.includes('fun_call')) {
          this.allLevels.add('Function and call');
        }
      }
    });
  }

  onClick(level: string): void {
    this.linesClicked = false;
    if (this.levelsClicked.has(level)) {
      this.levelsClicked.delete(level);
    } else {
      this.levelsClicked.add(level);
    }
    if (this.levelsClicked.size > 0) {
      setStatKind(StatKindType.entities);
    } else {
      this.linesClicked = true;
      setStatKind(StatKindType.lines);
    }
    this.reportService.updateLevelStats(this.levelsClicked);
  }

  onClickLines(): void {
    this.levelsClicked.clear();
    setStatKind(StatKindType.lines);
    this.reportService.updateLevelStats(this.levelsClicked);
    this.linesClicked = true;
  }
}
