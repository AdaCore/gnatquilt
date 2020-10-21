import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadJsonService {

  url = 'assets/report.json';

  constructor(private http: HttpClient) {}

  public getJSON(): Observable<any> {
    return this.http.get(this.url);
  }

  public setUrl(url: string): void{
    this.url = url;
  }
}
