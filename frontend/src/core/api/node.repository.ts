import {Inject, Injectable} from "@angular/core";
import {BackendService, DatabaseResponse} from "../services/backend.service";
import {NodeData} from '../../components/node/node-form/node-form.component';

@Injectable()
export class NodeRepository {

  constructor(@Inject (BackendService) private backend: BackendService) {
  }

  async getNodes(): Promise<NodeData[]> {
    return await this.backend.get('/nodes');
  }

  async getNode(node_unid: string): Promise<NodeData> {
    return await this.backend.get(`/node/${node_unid}`);
  }

  async updateNode(serverNode: NodeData): Promise<[DatabaseResponse, any]> {
    const result = await this.backend.post('/node/update', serverNode);
    return [result.status, result]
  }

  async deleteNode(node_unid: string): Promise<DatabaseResponse> {
    return await this.backend.delete('/node', node_unid);
  }
}
