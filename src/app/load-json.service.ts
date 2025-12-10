import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { isDevMode } from '@angular/core';
import { ScriptService } from 'ngx-script-loader';

// this is an external variable that will be progressively filled by gnatcoverage
// generated scripts, to get all the JSON data.
declare let REPORT: never;

@Injectable({
  providedIn: 'root',
})
export class LoadJsonService {
  private scriptService = inject(ScriptService);

  prefix = isDevMode() ? 'test/dhtml/' : '';

  public injectSource(name: string): Observable<Event> {
    return this.scriptService.loadScript(this.prefix + name);
  }

  public getJSON(url: string): Observable<never> {
    const keySplit: string[] = url.split('/');
    const key: string = keySplit[keySplit.length - 1];
    return this.scriptService
      .loadScript(this.prefix + key)
      .pipe(map((_) => REPORT[key]));
  }
}
