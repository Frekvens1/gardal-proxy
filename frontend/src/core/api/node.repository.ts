import {Inject, Injectable} from "@angular/core";
import {
  DatabaseResponse,
  DefaultService as BackendApi,
  NodeData,
  NodeDataRequest,
  PartialNodeDataRequest
} from '../../openapi-client';
import {lastValueFrom} from 'rxjs';

@Injectable()
export class NodeRepository {

  constructor(@Inject (BackendApi) private backendApi: BackendApi) {
  }

  getNodes(): Promise<NodeData[]> {
    return lastValueFrom(this.backendApi.getNodes());
  }

  getNode(node_slug: string): Promise<NodeData> {
    return lastValueFrom(this.backendApi.getNode(node_slug));
  }

  updateNode(request: NodeDataRequest): Promise<DatabaseResponse> {
    return lastValueFrom(this.backendApi.updateNode(request));
  }

  updateNodePartial(request: PartialNodeDataRequest): Promise<DatabaseResponse> {
    return lastValueFrom(this.backendApi.updateNodePartial(request));
  }

  deleteNode(node_slug: string): Promise<DatabaseResponse> {
    return lastValueFrom(this.backendApi.deleteNode(node_slug));
  }
}
