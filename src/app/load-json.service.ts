import {Observable, of, Subscriber} from 'rxjs';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import { isDevMode } from '@angular/core';
import {ScriptService} from 'ngx-script-loader';

// this is an external variable that will be progressively filled by gnatcoverage
// generated scripts, to get all the JSON data.
declare let REPORT: any;

@Injectable({
  providedIn: 'root'
})
export class LoadJsonService {

  prefix = isDevMode()?'test/dhtml/':'';

  constructor(private scriptService: ScriptService){
  }

  public injectSource(name: string): Observable<any> {
    return this.scriptService.loadScript(this.prefix + name);
  }

  public getJSON(url: string): Observable<any> {
    const keySplit: string[] = url.split('/');
    const key: string = keySplit[keySplit.length -1];
    return this.scriptService.loadScript(this.prefix + key).pipe(
      map ((_anything: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        REPORT[key]

      )
    );
  }
}
