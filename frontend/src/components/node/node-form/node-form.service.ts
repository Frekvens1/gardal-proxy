import {EventEmitter, Inject, Injectable} from "@angular/core";
import {NodeData, NodeDataRequest, NodeFormGroup} from './node-form.component';
import {NodeRepository} from '../../../core/api/node.repository';
import {MessageService} from 'primeng/api';
import {FormGroup} from '@angular/forms';
import {DatabaseResponse} from '../../../core/services/backend.service';

@Injectable()
export class NodeFormService {

  constructor(@Inject(NodeRepository) private nodeRepository: NodeRepository,
              @Inject(MessageService) private messageService: MessageService) {

  }

  async save(originalNodeUnid: string, nodeForm: FormGroup<NodeFormGroup>, onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]>): Promise<void> {
    const nodeData: NodeDataRequest = {
      original_node_unid: originalNodeUnid,
      node_unid: nodeForm.controls.node_unid.value,
      protocol: nodeForm.controls.protocol.value,
      hostname: nodeForm.controls.hostname.value,
      port: nodeForm.controls.port.value,
      path: nodeForm.controls.path.value,
    }

    let hasError = false;
    await this.nodeRepository.updateNode(nodeData).then(([response, data]) => {
      switch (response) {
        case 'CREATED':
          onSuccess.emit([response, nodeData]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully added!'});
          break;

        case 'UPDATED':
        case 'REPLACED':
          onSuccess.emit([response, nodeData]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully updated!'});
          break;

        default:
          hasError = true;
          console.error({
            data: data,
            nodeData: nodeData,
          });
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was an error while adding node!'
          });
          break;
      }
    }).catch((err) => {
      hasError = true;
      console.info({nodeData: nodeData});
      console.error(err);
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'There was an error while adding node!'});
    });

    if (!hasError) nodeForm.reset();
  }

  async delete(nodeData: NodeData, onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]>): Promise<void> {
    await this.nodeRepository.deleteNode(nodeData.node_unid).then(([response, data]) => {
      switch (response) {
        case 'DELETED':
          onSuccess.emit([response, {original_node_unid: nodeData.node_unid, ...nodeData}]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully deleted!'});
          break;

        default:
          console.info({
            data: data,
            nodeData: nodeData,
          });
          console.error('There was an error while removing node!');

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was an error while removing node!'
          });
          break;
      }
    }).catch((err) => {
      console.error(err);
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'There was an error while removing node!'});
    });
  }
}
