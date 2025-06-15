import {Component, EventEmitter, Inject, Input, Output} from "@angular/core";
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {InputText} from 'primeng/inputtext';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Panel} from 'primeng/panel';
import {Button} from 'primeng/button';
import {InputNumber} from 'primeng/inputnumber';
import {Select} from 'primeng/select';
import {NodeRepository} from '../../../core/api/node.repository';
import {MessageService} from 'primeng/api';
import {Toast} from 'primeng/toast';
import {DatabaseResponse} from '../../../core/services/backend.service';


export interface NodeFormGroup {
  node_unid: FormControl<string>;
  protocol: FormControl<nodeProtocols>;
  ip: FormControl<string>;
  port: FormControl<number>;
  path: FormControl<string>;
}

export interface NodeData {
  node_unid: string;
  protocol: nodeProtocols;
  ip: string;
  port: number;
  path: string;
}

export type nodeProtocols = 'http://' | 'https://';
export const nodeProtocolsList: nodeProtocols[] = ['http://', 'https://'];

@Component({
  selector: 'node-form',
  templateUrl: './node-form.component.html',
  styleUrls: ['./node-form.component.scss'],
  imports: [
    InputGroup,
    InputGroupAddon,
    InputText,
    FormsModule,
    Panel,
    Button,
    InputNumber,
    ReactiveFormsModule,
    Select,
    Toast
  ],
  providers: [
    NodeRepository,
    MessageService
  ],
  standalone: true
})

export class NodeFormComponent {

  @Input() node_unid: string = '';
  @Input() protocol: nodeProtocols = 'http://';
  @Input() ip: string = '';
  @Input() port: number = 8080;
  @Input() path: string = 'api/rawdata';

  @Output() onSuccess: EventEmitter<[DatabaseResponse, NodeData]> = new EventEmitter();

  nodeForm = new FormGroup<NodeFormGroup>({
    node_unid: new FormControl<string>(this.node_unid, {nonNullable: true, validators: [Validators.required]}),
    protocol: new FormControl<nodeProtocols>(this.protocol, {nonNullable: true, validators: [Validators.required]}),
    ip: new FormControl<string>(this.ip, {nonNullable: true, validators: [Validators.required]}),
    port: new FormControl<number>(this.port, {nonNullable: true, validators: [Validators.required]}),
    path: new FormControl<string>(this.path, {nonNullable: true}),
  });

  constructor(@Inject(NodeRepository) private nodeRepository: NodeRepository,
              @Inject(MessageService) private messageService: MessageService) {
  }

  async addNode(node: FormGroup<NodeFormGroup>): Promise<void> {
    const nodeData: NodeData = {
      node_unid: node.controls.node_unid.value,
      protocol: node.controls.protocol.value,
      ip: node.controls.ip.value,
      port: node.controls.port.value,
      path: node.controls.path.value,
    }

    await this.nodeRepository.updateNode(nodeData).then(([response, data]) => {
      switch (response) {
        case 'CREATED':
          this.onSuccess.emit([response, nodeData]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully added!'});
          break;

        case 'UPDATED':
          this.onSuccess.emit([response, nodeData]);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Node successfully updated!'});
          break;

        default:
          console.error(data)
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was an error while adding node!'
          });
          break;
      }
    }).catch((err) => {
      console.log(err);
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'There was an error while adding node!'});
    });

    node.reset();
  }

  readonly nodeProtocolsList = nodeProtocolsList;
}
