import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {InputText} from 'primeng/inputtext';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputNumber} from 'primeng/inputnumber';
import {Select} from 'primeng/select';
import {NodeRepository} from '../../../core/api/node.repository';
import {MessageService} from 'primeng/api';
import {DatabaseResponse} from '../../../core/services/backend.service';
import {IftaLabel} from 'primeng/iftalabel';
import {KeyFilter} from 'primeng/keyfilter';
import {AutoFocus} from 'primeng/autofocus';


export interface NodeFormGroup {
  node_unid: FormControl<string>;
  protocol: FormControl<nodeProtocols>;
  hostname: FormControl<string>;
  port: FormControl<number>;
  path: FormControl<string>;
}

export interface NodeData {
  node_unid: string;
  protocol: nodeProtocols;
  hostname: string;
  port: number;
  path: string;
}

export interface NodeDataRequest extends NodeData {
  original_node_unid: string;
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
    InputNumber,
    ReactiveFormsModule,
    Select,
    IftaLabel,
    KeyFilter,
    AutoFocus
  ],
  providers: [
    NodeRepository,
    MessageService
  ],
  standalone: true
})

export class NodeFormComponent implements OnInit {

  @Input() node_unid: string = '';
  @Input() protocol: nodeProtocols = 'http://';
  @Input() ip: string = '';
  @Input() port: number = 8080;
  @Input() path: string = 'api/http/routers'; //'api/rawdata';

  @Input() nodeData: NodeData | undefined;
  @Input() existingNodeUnids: string[] = [];

  @Input() parentElement: any | undefined;

  @Output() onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]> = new EventEmitter();
  @Output() onChange: EventEmitter<[string, FormControl]> = new EventEmitter();

  idSafe = {input: /^[a-zA-Z0-9-]*$/g, paste: /[^a-zA-Z0-9-]/g};
  hostnameSafe = {input: /^[a-zA-Z0-9.]*$/g, paste: /[^a-zA-Z0-9.]/g};
  pathSafe = {input: /^[a-zA-Z0-9/_-]*$/g, paste: /[^a-zA-Z0-9/_-]/g};

  isUpdating: boolean = false;

  public form = new FormGroup<NodeFormGroup>({
    node_unid: new FormControl<string>(this.node_unid, {nonNullable: true, validators: [Validators.required]}),
    protocol: new FormControl<nodeProtocols>(this.protocol, {nonNullable: true, validators: [Validators.required]}),
    hostname: new FormControl<string>(this.ip, {nonNullable: true, validators: [Validators.required]}),
    port: new FormControl<number>(this.port, {nonNullable: true, validators: [Validators.required]}),
    path: new FormControl<string>(this.path, {nonNullable: true}),
  });

  constructor() {
  }

  ngOnInit(): void {
    if (this.nodeData) {
      this.isUpdating = true;
      const data = this.nodeData;
      this.form.controls.node_unid.setValue(data.node_unid);
      this.form.controls.protocol.setValue(data.protocol);
      this.form.controls.hostname.setValue(data.hostname);
      this.form.controls.port.setValue(data.port);
      this.form.controls.path.setValue(data.path);
    }
  }

  onChangeEvent(control: FormControl): void {
    const controlName = Object.keys(this.form.controls).find(name =>
      control === (this.form.controls as unknown as { [key: string]: AbstractControl })[name]
    );

    if (controlName == null) return;
    this.onChange.emit([controlName, control]);
  }

  onPaste(control: FormControl, regex: RegExp, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedInput: string = event.clipboardData?.getData('text') || '';
    const sanitizedInput: string = pastedInput.replace(regex, '');

    const current: string = control.value || '';
    const selectionStart = (event.target as HTMLInputElement).selectionStart || 0;
    const selectionEnd = (event.target as HTMLInputElement).selectionEnd || 0;


    const newValue = current.substring(0, selectionStart) +
      sanitizedInput +
      current.substring(selectionEnd);
    control.setValue(newValue);
  }


  readonly nodeProtocolsList = nodeProtocolsList;
}
