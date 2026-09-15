import { Observable, Subject } from 'rxjs';

/**
 * Height of a collapsed source line.
 *
 * Tied to the line-height forced on `xcov-source-line-code` in style.scss.
 * Changing one without the other makes the virtualizer lay rows out at a pitch
 * the browser does not honour.
 */
export const COLLAPSED_ROW_HEIGHT = 20;

/**
 * Height model for the annotated source view.
 *
 * The virtualizer asks for the height of a row through `estimateSize`, for
 * rows it has not rendered yet. Every answer that turns out wrong costs a
 * shift: the virtualizer lays the rows out from the estimates, then corrects
 * once the real element is measured. Correcting on every frame is what the
 * previous scroller did, and what the user saw as flicker.
 *
 * So the answers here have to be exact, not estimates. They can be:
 *
 *   - a collapsed line is always `collapsedHeight`, because the line-height is
 *     pinned in style.scss and the code does not wrap;
 *   - an expanded line is whatever it measured when the user expanded it. Its
 *     height cannot be computed, since a message body wraps on both newlines
 *     and width.
 *
 * Measuring on expand is not a correction pass. It happens on a click, once,
 * for a row that is on screen by definition.
 *
 * Rows are keyed by index into `mappings`, not by line number.
 */
export class RowHeights {
  private cachedHeights = new Map<number, number>();
  private readonly changed = new Subject<void>();
  private readonly invalidated = new Subject<void>();

  /**
   * @param collapsedHeight Height of a collapsed line. Must match the
   *   line-height forced in style.scss, or the layout drifts from the
   *   virtualizer's idea of it.
   */
  constructor(private readonly collapsedHeight: number) {}

  /** Emits when a height changed, so the virtualizer can be re-measured. */
  public changedEventListener(): Observable<void> {
    return this.changed.asObservable();
  }

  /**
   * Emits when every recorded height was dropped, i.e. when every Expanded lines still on
   * screen listen to this and measure themselves again.
   */
  public invalidatedEventListener(): Observable<void> {
    return this.invalidated.asObservable();
  }

  /**
   * Height of row `index`.
   *
   * This is what the virtualizer calls. It must be total: every index has an
   * answer, whether or not it was ever measured.
   */
  public heightOf(index: number): number {
    if (this.cachedHeights.has(index)) return this.cachedHeights.get(index);
    return this.collapsedHeight;
  }

  /** Records the height row `index` occupied once expanded. */
  public expanded(index: number, height: number): void {
    this.cachedHeights.set(index, height);
    this.changed.next();
  }

  /** Drops what was recorded for row `index`, back to a collapsed line. */
  public collapsed(index: number): void {
    this.cachedHeights.delete(index);
    this.changed.next();
  }

  /**
   * Invalidates every recorded height.
   *
   * Called when the viewport width changes, which rewraps all the message
   * bodies at once.
   *
   * The expanded rows still on screen answer `invalidated` and report
   * themselves again. The ones off screen cannot be measured, so they read as
   * collapsed until they scroll back into view, where they measure like any
   * row appearing for the first time.
   */
  public invalidate(): void {
    this.cachedHeights.clear();
    this.invalidated.next();
    this.changed.next();
  }
}
