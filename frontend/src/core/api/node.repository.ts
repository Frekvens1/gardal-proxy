import {Inject, Injectable} from "@angular/core";
import {BackendService, DatabaseResponse} from "../services/backend.service";
import {NodeData, NodeDataRequest} from '../../components/node/node-form/node-form.component';

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

  async updateNode(serverNode: NodeDataRequest): Promise<[DatabaseResponse, any]> {
    const result = await this.backend.post('/node', serverNode);
    return [result.status, result]
  }

  async deleteNode(node_unid: string): Promise<[DatabaseResponse, any]> {
    const result = await this.backend.delete('/node', node_unid);
    return [result.status, result]
  }
}
