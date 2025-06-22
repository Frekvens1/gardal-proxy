import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {Table, TableModule, TableService} from 'primeng/table';
import {NodeFormComponent} from '../node-form/node-form.component';
import {NodeRepository} from '../../../core/api/node.repository';
import {Button, ButtonIcon} from 'primeng/button';
import {ChevronDownIcon, ChevronRightIcon} from 'primeng/icons';
import {Ripple} from 'primeng/ripple';
import {HostRepository} from '../../../core/api/host.repository';
import {forkJoin} from 'rxjs';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {NodeFormService} from '../node-form/node-form.service';
import {DeleteModalComponent} from '../../../core/modals/delete-modal/delete-modal.component';
import {Badge} from 'primeng/badge';
import {FormControl, FormsModule} from '@angular/forms';
import {Clipboard} from '@angular/cdk/clipboard';
import {Popover} from 'primeng/popover';
import {NgClass} from '@angular/common';
import {
  DatabaseResponse,
  HostData,
  HostDict,
  NodeData,
  NodeDataRequest,
  PartialNodeDataRequest
} from '../../../openapi-client';
import {InputSwitch} from 'primeng/inputswitch';


type GridColumnType = typeof GridColumnType[keyof typeof GridColumnType];
const GridColumnType = {
  Text: 'TEXT',
  Boolean: 'BOOLEAN',
  Date: 'DATE',
} as const;

interface GridColumn {
  field: string;
  header: string;
  type?: GridColumnType;
}

interface GridRow {
  data: NodeData;
  hostnames: HostData | undefined;
  config_url: string;
  redirect_url: string;
}

@Component({
  selector: 'node-grid',
  templateUrl: './node-grid.component.html',
  styleUrls: ['./node-grid.component.scss'],
  standalone: true,
  imports: [
    TableModule,
    ButtonIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    Ripple,
    Tag,
    Button,
    NodeFormComponent,
    Dialog,
    DeleteModalComponent,
    Badge,
    Popover,
    NgClass,
    FormsModule,
    InputSwitch,
  ],
  providers: [
    NodeRepository,
    HostRepository,
    NodeFormService,
    ConfirmationService,
    TableService,
    Table,
  ]
})

export class GridView implements OnInit {
  constructor(@Inject(NodeRepository) private nodeRepository: NodeRepository,
              @Inject(HostRepository) private hostnameRepository: HostRepository,
              @Inject(MessageService) private messageService: MessageService,
              @Inject(NodeFormService) private nodeFormService: NodeFormService,
              private clipboard: Clipboard) {
  }

  @ViewChild('headerElement') headerRef!: ElementRef;
  @ViewChild('rowElement') rowRef!: ElementRef;

  @Input() scrollHeight: number = 400;
  @Input() onNodeChange: EventEmitter<[DatabaseResponse, NodeDataRequest]> = new EventEmitter();

  @ViewChild('nodeForm') nodeForm: NodeFormComponent | undefined;
  @ViewChild('deleteModalComponent') deleteModalComponent: DeleteModalComponent | undefined;

  nodes: NodeData[] = [];
  hostnames: HostDict | undefined;

  ngOnInit(): void {
    this.refreshRows();
    this.onNodeChange.subscribe(
      ([response, nodeDataRequest]: [DatabaseResponse, NodeDataRequest]) =>
        this.nodeChanged(response, nodeDataRequest)
    );
  }

  onClipboard(text: string, popover: Popover, event: Event): void {
    this.clipboard.copy(text);
    popover.show(event);

    setTimeout(() => {
      popover.hide();
    }, 750);
  }

  // region { Grid }

  rows: GridRow[] = [];
  columns: GridColumn[] = [
    {field: 'data.name', header: 'Name'},
    {field: 'data.node_slug', header: 'ID'},
    {field: 'data.config_url.protocol', header: 'Protocol'},
    {field: 'data.config_url.hostname', header: 'Hostname'},
    {field: 'data.config_url.port', header: 'Port'},
    {field: 'data.enabled', header: 'Enabled', type: 'BOOLEAN'},
    {field: 'data.fetch_config', header: 'Fetch config', type: 'BOOLEAN'},
  ];

  headerOffset: number = 0;
  rowOffset: number = 0;
  isRefreshingRows: boolean = false;

  refreshRows(): void {
    if (this.isRefreshingRows) return;
    this.isRefreshingRows = true;

    forkJoin({
      nodes: this.nodeRepository.getNodes(),
      hostnames: this.hostnameRepository.getHosts(),
    }).subscribe({
      next: (result) => {
        this.nodes = result.nodes;
        this.hostnames = result.hostnames;
        this.updateRows(result.nodes, result.hostnames);
        this.isRefreshingRows = false;
      },
      error: (err) => {
        this.isRefreshingRows = false;
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not refresh the grid!'
        });
      }
    });
  }

  updateRows(nodes: NodeData[], hostnames: HostDict | undefined): void {
    const rowsBuilder: GridRow[] = [];
    if (!nodes) return;
    for (const node of nodes) {
      const configUrl = `${node.config_url.protocol}://${node.config_url.hostname}:${node.config_url.port}/${node.config_url.path}`;
      const redirect_url = `${node.redirect_url.protocol}://${node.redirect_url.hostname}:${node.redirect_url.port}`;
      rowsBuilder.push({
        data: node,
        hostnames: hostnames?.hosts[node.node_slug],
        config_url: configUrl,
        redirect_url: redirect_url,
      });
    }

    this.rows = rowsBuilder;

    setTimeout(() => {
      this.headerOffset = this.headerRef?.nativeElement?.offsetHeight - 10 || 0;
      this.rowOffset = this.headerOffset + this.rowRef?.nativeElement?.offsetHeight - 1 || 0;
    });
  }

  getNestedValue(dict: { [key: string]: any }, field: string): any {
    const keys = field.split('.');
    let nested = dict;

    for (const key of keys) {
      if (nested && typeof nested === 'object' && key in nested) {
        nested = nested[key];
      } else {
        return undefined;
      }
    }

    return nested;
  }


  setNestedValue(dict: { [key: string]: any }, field: string, value: any): void {
    const keys = field.split('.');
    let current = dict;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) current[key] = {};
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  createNestedField(path: string, value: any): any {
    return path.split('.').reverse().reduce((acc, key) => ({[key]: acc}), value);
  }

  // endregion

  // region { Node }

  nodeDataEdit: NodeData | undefined;

  isDeletingNode: { [key: string]: boolean } = {};
  isFieldActionNode: { [key: string]: { [key: string]: boolean } | undefined } = {};

  isSavingNode: boolean = false;
  isReplacingNode: boolean = false;
  showEditNodeModal: boolean = false;

  openEditNodeModal(node?: NodeData): void {
    this.nodeDataEdit = node;
    this.isReplacingNode = false;
    this.showEditNodeModal = true;
  }

  closeEditNodeModal(): void {
    this.nodeDataEdit = undefined;
    this.isReplacingNode = false;
    this.showEditNodeModal = false;
  }

  nodeExists(nodeParam: { data?: NodeData, nodeSlug?: string }): boolean {
    let nodeSlug: string | undefined = nodeParam.data?.node_slug;
    if (!nodeSlug) nodeSlug = nodeParam.nodeSlug;
    if (nodeSlug == undefined) return false;

    if (this.nodeDataEdit?.node_slug == nodeSlug) return false;
    return this.nodes.some((node) => node.node_slug == nodeSlug);
  }

  async saveEditNodeModal(): Promise<void> {
    let hasError = false;
    if (this.nodeForm && this.nodeForm.form) {
      this.isSavingNode = true;
      const nodeData: NodeData = this.nodeFormService.toNodeData(this.nodeForm.form);
      const currentSlug: string = this.nodeDataEdit?.node_slug || nodeData.node_slug;

      hasError = !await this.nodeFormService.save(currentSlug, nodeData, this.onNodeChange);
      this.isSavingNode = false;
    }

    this.showEditNodeModal = hasError;
  }

  async deleteNodeModal(gridRow: GridRow): Promise<void> {
    if (this.deleteModalComponent) {
      const accepted = await this.deleteModalComponent.confirm(
        `You are about to delete traefik node:\n${gridRow.data.node_slug}`
      );

      if (!accepted) return;
      this.isDeletingNode[gridRow.data.node_slug] = true;
      await this.nodeFormService.delete(gridRow.data, this.onNodeChange);
      delete this.isDeletingNode[gridRow.data.node_slug];
    }
  }

  nodeFormChanged(event: [string, FormControl]): void {
    const [controlName, control] = event;
    if (controlName != 'node_slug') return;
    this.isReplacingNode = this.nodeExists({nodeSlug: control.value as string})
  }

  // endregion

  // region { Private }

  private nodeChanged(response: DatabaseResponse, nodeData: NodeDataRequest): void {
    let index = -1;
    switch (response) {
      case 'CREATED':
        this.nodes.push(nodeData);
        break;

      case 'UPDATED':
        index = this.nodes.findIndex(node => node.node_slug === nodeData.node_slug);
        if (index !== -1) {
          this.nodes[index] = nodeData;
        }
        break;

      case 'REPLACED':
        index = this.nodes.findIndex(node => node.node_slug === nodeData.lookup_id);
        if (index !== -1) {
          this.nodes.splice(index, 1);
        }

        index = this.nodes.findIndex(node => node.node_slug === nodeData.node_slug);
        if (index !== -1) {
          this.nodes[index] = nodeData;
        } else {
          this.nodes.push(nodeData);
        }

        break;

      case 'DELETED':
        index = this.nodes.findIndex(node => node.node_slug === nodeData.node_slug);
        if (index !== -1) {
          this.nodes.splice(index, 1);
        }
        break;
    }

    this.updateRows(this.nodes, this.hostnames);
  }

  async toggleBooleanField(row: GridRow, field: string): Promise<void> {
    const node_slug = row.data.node_slug;
    const value = this.getNestedValue(row, field);
    const rowData = this.createNestedField(field, !value);
    const nodeData: PartialNodeDataRequest = {...rowData?.['data'], node_slug: node_slug, lookup_id: node_slug};

    this.setNestedValue(row, field, undefined);
    if (!(node_slug in this.isFieldActionNode)) {
      this.isFieldActionNode[node_slug] = {};
    }

    const success = () => {
      this.setNestedValue(row, field, !value);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Successfully updated the value!'
      });
    }

    const error = () => {
      this.setNestedValue(row, field, value);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'There was an error updating the value!'
      });
    }

    this.isFieldActionNode[node_slug]![field] = true;
    await this.nodeRepository.updateNodePartial(nodeData).then((response: DatabaseResponse) => {
      switch (response) {
        case 'REPLACED':
        case 'UPDATED':
          success();
          break;
        default:
          console.error(response);
          error();
      }

    }).catch((err: Error) => {
      console.error(err);
      error();
    });

    delete this.isFieldActionNode[node_slug]![field];
  }

  // endregion
}
