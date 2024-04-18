import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportService, setStatKind, StatKindType } from './report.service';
import { Router, Scroll } from '@angular/router';
import { delay, filter } from 'rxjs/operators';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'gnatquilt';
  coverageLevel$: Observable<string>;
  allLevels: Set<string> = new Set();

  levelsClicked: Set<string> = new Set();
  linesClicked = true;
  constructor(
    router: Router,
    viewportScroller: ViewportScroller,
    private reportService: ReportService
  ) {
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
        } else {
          // forward navigation
          viewportScroller.scrollToPosition([0, 0]);
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
      }
    });
  }

  ngOnInit(): void {}

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
