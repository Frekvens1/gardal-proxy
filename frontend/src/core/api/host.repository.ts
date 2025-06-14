import {Inject, Injectable} from "@angular/core";
import {BackendService} from "../services/backend.service";

@Injectable()
export class HostRepository {

  constructor(@Inject (BackendService) private backend: BackendService) {
  }

  async getHosts() {
    return await this.backend.get('/hosts');
  }
}
