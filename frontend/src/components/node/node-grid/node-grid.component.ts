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
import {FormControl} from '@angular/forms';
import {Clipboard} from '@angular/cdk/clipboard';
import {Popover} from 'primeng/popover';
import {NgClass} from '@angular/common';
import {DatabaseResponse, HostData, HostDict, NodeData, NodeDataRequest} from '../../../openapi-client';

interface GridColumn {
  field: string;
  header: string;
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

  getNestedValue(dict: {[key: string]: any}, field: string) {
    return field.split('.').reduce((nested, key) => nested && nested[key], dict);
  }

  // endregion

  // region { Node }

  nodeDataEdit: NodeData | undefined;

  isDeletingNode: { [key: string]: boolean } = {};
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
    if (this.nodeForm && this.nodeForm.form) {
      this.isSavingNode = true;
      const nodeData: NodeData = this.nodeFormService.toNodeData(this.nodeForm.form);
      const currentSlug: string = this.nodeDataEdit?.node_slug || nodeData.node_slug;

      await this.nodeFormService.save(currentSlug, nodeData, this.onNodeChange);
      this.isSavingNode = false;
    }

    this.showEditNodeModal = false;
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
        index = this.nodes.findIndex(node => node.node_slug === nodeData.existing_node_slug);
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

  // endregion
}
