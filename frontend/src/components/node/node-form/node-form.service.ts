import {EventEmitter, Inject, Injectable} from "@angular/core";
import {NodeRepository} from '../../../core/api/node.repository';
import {MessageService} from 'primeng/api';
import {FormBuilder, FormControl, FormGroup, NonNullableFormBuilder, Validators} from '@angular/forms';
import {ConfigURLData, DatabaseResponse, NodeData, NodeDataRequest} from '../../../openapi-client';
import ProtocolEnum = ConfigURLData.ProtocolEnum;

interface ConfigUrlFormGroup {
  protocol: FormControl<ProtocolEnum>;
  hostname: FormControl<string>;
  port: FormControl<number>;
  path: FormControl<string | null>;
}

interface RedirectUrlFormGroup {
  protocol: FormControl<ProtocolEnum>;
  hostname: FormControl<string>;
  port: FormControl<number>;
}

export interface NodeFormGroup {
  name: FormControl<string>;
  node_slug: FormControl<string>;
  config_url: FormGroup<ConfigUrlFormGroup>;
  redirect_url: FormGroup<RedirectUrlFormGroup>;
}

export type nodeProtocols = 'http' | 'https';
export const nodeProtocolsList: nodeProtocols[] = ['http', 'https'];

@Injectable()
export class NodeFormService {

  constructor(@Inject(NodeRepository) private nodeRepository: NodeRepository,
              @Inject(MessageService) private messageService: MessageService,
              private formBuilder: NonNullableFormBuilder,
              private formBuilderNull: FormBuilder) {

  }

  createNodeForm(initial: Partial<NodeData> = {}): FormGroup<NodeFormGroup> {
    return this.formBuilder.group({
      name: this.formBuilder.control(initial.name ?? '', Validators.required),
      node_slug: this.formBuilder.control(initial.node_slug ?? '', Validators.required),
      config_url: this.formBuilder.group({
        protocol: this.formBuilder.control(initial.config_url?.protocol ?? 'http', Validators.required),
        hostname: this.formBuilder.control(initial.config_url?.hostname ?? '', Validators.required),
        port: this.formBuilder.control(initial.config_url?.port ?? 8080, [
          Validators.required,
          Validators.min(1),
          Validators.max(65535),
        ]),
        path: this.formBuilderNull.control(initial.config_url?.path ?? ''),
      }),
      redirect_url: this.formBuilder.group({
        protocol: this.formBuilder.control(initial.redirect_url?.protocol ?? 'http', Validators.required),
        hostname: this.formBuilder.control(initial.redirect_url?.hostname ?? '', Validators.required),
        port: this.formBuilder.control(initial.redirect_url?.port ?? 8080, [
          Validators.required,
          Validators.min(1),
          Validators.max(65535),
        ]),
      }),
    });
  }

  toNodeData(form: FormGroup<NodeFormGroup>): NodeData {
    return form.getRawValue();
  }


  async save(existingNodeSlug: string, nodeData: NodeData, onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]>): Promise<boolean> {
    if (nodeData.config_url.path) nodeData.config_url.path = nodeData.config_url.path.replace(/^\/+/, '');
    const request = {...nodeData, lookup_id: existingNodeSlug} as NodeDataRequest;

    let noErrors = true;
    await this.nodeRepository.updateNode(request).then((response) => {
      switch (response) {
        case 'CREATED':
          onSuccess.emit([response, request]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully added!'});
          break;

        case 'UPDATED':
        case 'REPLACED':
          onSuccess.emit([response, request]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully updated!'});
          break;

        default:
          noErrors = false;
          console.error({
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
      noErrors = false;
      console.info({nodeData: nodeData});
      console.error(err);
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'There was an error while adding node!'});
    });

    return noErrors;
  }

  async delete(nodeData: NodeData, onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]>): Promise<void> {
    await this.nodeRepository.deleteNode(nodeData.node_slug).then((response) => {
      switch (response) {
        case 'DELETED':
          onSuccess.emit([response, {...nodeData, lookup_id: nodeData.node_slug}]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully deleted!'});
          break;

        default:
          console.info({
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
