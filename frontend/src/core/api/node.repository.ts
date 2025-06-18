import {Inject, Injectable} from "@angular/core";
import {DatabaseResponse, DefaultService as BackendApi, NodeData, NodeDataRequest} from '../../openapi-client';
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

  deleteNode(node_slug: string): Promise<DatabaseResponse> {
    return lastValueFrom(this.backendApi.deleteNode(node_slug));
  }
}
