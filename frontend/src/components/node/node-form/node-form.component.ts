import {Component, EventEmitter, Inject, Input, OnInit, Output} from "@angular/core";
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {InputText} from 'primeng/inputtext';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {InputNumber} from 'primeng/inputnumber';
import {Select} from 'primeng/select';
import {NodeRepository} from '../../../core/api/node.repository';
import {MessageService} from 'primeng/api';
import {IftaLabel} from 'primeng/iftalabel';
import {KeyFilter} from 'primeng/keyfilter';
import {UserAgentService} from '../../../core/services/user-agent.service';
import {NgClass} from '@angular/common';
import {DatabaseResponse, NodeData, NodeDataRequest} from '../../../openapi-client';
import {NodeFormGroup, NodeFormService, nodeProtocols, nodeProtocolsList} from './node-form.service';

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
    NgClass,
  ],
  providers: [
    NodeRepository,
    MessageService
  ],
  standalone: true
})

export class NodeFormComponent implements OnInit {

  @Input() node_slug: string = '';
  @Input() protocol: nodeProtocols = 'http';
  @Input() ip: string = '';
  @Input() port: number = 8080;
  @Input() path: string = 'api/http/routers'; //'api/rawdata';

  @Input() nodeData: NodeData | undefined;
  @Input() nodeSlugExists: boolean = false;
  @Input() existingNodeSlugs: string[] = [];

  @Input() parentElement: any | undefined;

  largeScreen: boolean = false;

  @Output() onSuccess: EventEmitter<[DatabaseResponse, NodeDataRequest]> = new EventEmitter();
  @Output() onChange: EventEmitter<[string, FormControl]> = new EventEmitter();

  idSafe = {input: /^[a-z0-9_-]*$/, paste: /[^a-z0-9_-]/g};
  hostnameSafe = {input: /^[a-zA-Z0-9.]*$/, paste: /[^a-zA-Z0-9.]/g};
  pathSafe = {input: /^[a-zA-Z0-9/_-]*$/, paste: /[^a-zA-Z0-9/_-]/g};

  isUpdating: boolean = false;

  public form: FormGroup<NodeFormGroup> | undefined;

  constructor(@Inject(UserAgentService) private userAgentService: UserAgentService,
              @Inject(NodeFormService) private nodeFormService: NodeFormService) {
  }



  ngOnInit(): void {
    this.form = this.nodeFormService.createNodeForm();
    this.largeScreen = !this.userAgentService.lg();

    if (this.nodeData) {
      this.isUpdating = true;
      const configControls = this.form.controls.config_url.controls;
      const redirectControls = this.form.controls.redirect_url.controls;

      this.form.controls.name.setValue(this.nodeData.name || '');
      this.form.controls.node_slug.setValue(this.nodeData.node_slug);

      configControls.protocol.setValue(this.nodeData.config_url.protocol);
      configControls.hostname.setValue(this.nodeData.config_url.hostname);
      configControls.port.setValue(this.nodeData.config_url.port);
      configControls.path.setValue(this.nodeData.config_url.path);

      redirectControls.protocol.setValue(this.nodeData.redirect_url.protocol);
      redirectControls.hostname.setValue(this.nodeData.redirect_url.hostname);
      redirectControls.port.setValue(this.nodeData.redirect_url.port);
    }
  }

  onChangeEvent(control: FormControl): void {
    const controlName = Object.keys(this.form?.controls || {}).find(name =>
      control === (this.form?.controls as unknown as { [key: string]: AbstractControl })[name]
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

  protected readonly nodeProtocolsList = nodeProtocolsList;
}
