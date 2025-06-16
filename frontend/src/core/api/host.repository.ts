import {Inject, Injectable} from "@angular/core";
import {BackendService} from "../services/backend.service";

export type Hostnames = { [key: string]: HostnameData };
export interface HostnameData {
  active: { [key: string]: string[] };
  all: { [key: string]: string[] };
}

@Injectable()
export class HostRepository {

  constructor(@Inject (BackendService) private backend: BackendService) {
  }

  async getHosts(): Promise<Hostnames> {
    return await this.backend.get('/hosts');
  }
}
