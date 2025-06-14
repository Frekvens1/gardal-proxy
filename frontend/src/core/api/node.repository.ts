import {Inject, Injectable} from "@angular/core";
import {BackendService} from "../services/backend.service";

@Injectable()
export class NodeRepository {

  constructor(@Inject (BackendService) private backend: BackendService) {
  }

  async getNodes() {
    return await this.backend.get('/nodes');
  }

  async getNode(nodeUnid: string) {
    return await this.backend.get(`/node/${nodeUnid}`);
  }

  async updateNode(serverNode: {nodeUnid: string, ip: string, port: number}) {
    return await this.backend.post('/node/update', {
      node_unid: serverNode.nodeUnid,
      ip: serverNode.ip,
      port: serverNode.port
    });
  }

  async deleteNode(nodeUnid: string) {
    return await this.backend.delete('/node', nodeUnid);
  }
}
