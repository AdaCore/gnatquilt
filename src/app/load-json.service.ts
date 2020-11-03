import { HttpClient } from '@angular/common/http';
import {Observable, Subscriber} from 'rxjs';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import { isDevMode } from '@angular/core';

// this is an external variable that will be progressively filled by gnatcoverage
// generated scripts, to get all the JSON data.
declare let REPORT: any;

@Injectable({
  providedIn: 'root'
})
export class LoadJsonService {

  url = 'report.js';

  prefix = isDevMode()?'generated/':'';

  constructor(private http: HttpClient) {}

  public injectSource(name: string): Observable<any> {
    return new Observable((observer: Subscriber<any>) => {
      const source: HTMLScriptElement = document.createElement('script');
      source.src = this.prefix + name;
      source.async = false;
      source.onload = () => observer.next(true);
      document.head.appendChild(source);
    });
  }

  public getJSON(): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const tmp: this = this;
    const keySplit: string[] = tmp.url.split('/');
    const key: string = keySplit[keySplit.length -1];
    return this.injectSource(key).pipe(
      map ((_anything: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        REPORT[key]
      )
    );
  }

  public setUrl(url: string): void{
    this.url = url;
  }
}
