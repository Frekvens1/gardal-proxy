import {Inject, Injectable} from "@angular/core";
import {DefaultService as BackendApi, HostDict} from '../../openapi-client';
import {lastValueFrom, Observable} from 'rxjs';

@Injectable()
export class HostRepository {

  constructor(@Inject (BackendApi) private backendApi: BackendApi) {
  }

  getHosts(): Promise<HostDict> {
    return lastValueFrom(this.backendApi.getHosts());
  }
}
