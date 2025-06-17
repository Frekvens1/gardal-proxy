import {AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {Table, TableModule, TableService} from 'primeng/table';
import {NodeData, NodeDataRequest, NodeFormComponent} from '../node-form/node-form.component';
import {NodeRepository} from '../../../core/api/node.repository';
import {Button, ButtonIcon} from 'primeng/button';
import {ChevronDownIcon, ChevronRightIcon} from 'primeng/icons';
import {Ripple} from 'primeng/ripple';
import {HostnameData, Hostnames, HostRepository} from '../../../core/api/host.repository';
import {DatabaseResponse} from '../../../core/services/backend.service';
import {forkJoin} from 'rxjs';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {ConfirmationService} from 'primeng/api';
import {NodeFormService} from '../node-form/node-form.service';
import {DeleteModalComponent} from '../../../core/modals/delete-modal/delete-modal.component';
import {Badge} from 'primeng/badge';
import {FormControl} from '@angular/forms';
import {Clipboard} from '@angular/cdk/clipboard';
import {Popover} from 'primeng/popover';
import {NgClass} from '@angular/common';
import {UserAgentService} from '../../../core/services/user-agent.service';

interface GridColumn {
  field: string;
  header: string;
}

interface GridRow {
  data: NodeData;
  hostnames: HostnameData;
  config_url: string;
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
  hostnames: Hostnames = {};

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
    {field: 'node_unid', header: 'ID'},
    {field: 'protocol', header: 'Protocol'},
    {field: 'hostname', header: 'Hostname'},
    {field: 'port', header: 'Port'},
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
    }).subscribe((result) => {
      this.nodes = result.nodes;
      this.hostnames = result.hostnames;
      this.updateRows(result.nodes, result.hostnames);
      this.isRefreshingRows = false;
    });
  }

  updateRows(nodes: NodeData[], hostnames: Hostnames): void {
    const rowsBuilder: GridRow[] = [];
    if (!nodes) return;
    for (const node of nodes) {
      const configUrl = `${node.protocol}${node.hostname}:${node.port}/${node.path}`;
      rowsBuilder.push({
        data: node,
        hostnames: hostnames[node.node_unid],
        config_url: configUrl,
      });
    }

    this.rows = rowsBuilder;

    setTimeout(() => {
      this.headerOffset = this.headerRef?.nativeElement?.offsetHeight - 10 || 0;
      this.rowOffset = this.headerOffset + this.rowRef?.nativeElement?.offsetHeight - 1 || 0;
    });
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

  nodeExists(node: { data?: NodeData, unid?: string }): boolean {
    let nodeUnid: string | undefined = node.data?.node_unid;
    if (!nodeUnid) nodeUnid = node.unid;
    if (nodeUnid == undefined) return false;

    if (this.nodeDataEdit?.node_unid == nodeUnid) return false;
    return this.nodes.some((node) => node.node_unid == nodeUnid);
  }

  async saveEditNodeModal(): Promise<void> {
    if (this.nodeForm) {
      this.isSavingNode = true;
      const node_unid = this.nodeDataEdit?.node_unid || this.nodeForm.form.controls.node_unid.value;
      await this.nodeFormService.save(node_unid, this.nodeForm.form, this.onNodeChange);
      this.isSavingNode = false;
    }

    this.showEditNodeModal = false;
  }

  async deleteNodeModal(gridRow: GridRow): Promise<void> {
    if (this.deleteModalComponent) {
      const accepted = await this.deleteModalComponent.confirm(
        `You are about to delete traefik node:\n${gridRow.data.node_unid}`
      );

      if (!accepted) return;
      this.isDeletingNode[gridRow.data.node_unid] = true;
      await this.nodeFormService.delete(gridRow.data, this.onNodeChange);
      delete this.isDeletingNode[gridRow.data.node_unid];
    }
  }

  nodeFormChanged(event: [string, FormControl]): void {
    const [controlName, control] = event;
    if (controlName != 'node_unid') return;
    this.isReplacingNode = this.nodeExists({unid: control.value})
  }

  // endregion

  // region { Private }

  private nodeChanged(response: DatabaseResponse, nodeDataRequest: NodeDataRequest): void {
    const {original_node_unid, ...nodeData} = nodeDataRequest;

    let index = -1;
    switch (response) {
      case 'CREATED':
        this.nodes.push(nodeData);
        break;

      case 'UPDATED':
        index = this.nodes.findIndex(node => node.node_unid === nodeData.node_unid);
        if (index !== -1) {
          this.nodes[index] = nodeData;
        }
        break;

      case 'REPLACED':
        index = this.nodes.findIndex(node => node.node_unid === nodeData.node_unid);
        if (index !== -1) {
          this.nodes.splice(index, 1);
        }

        index = this.nodes.findIndex(node => node.node_unid === original_node_unid);
        if (index !== -1) {
          this.nodes[index] = nodeData;
        }

        break;

      case 'DELETED':
        index = this.nodes.findIndex(node => node.node_unid === nodeData.node_unid);
        if (index !== -1) {
          this.nodes.splice(index, 1);
        }
        break;
    }

    this.updateRows(this.nodes, this.hostnames);
  }

  // endregion
}
