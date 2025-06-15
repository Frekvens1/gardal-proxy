import {Component, EventEmitter, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {TableModule} from 'primeng/table';
import {NodeData, NodeDataRequest, NodeFormComponent} from '../node-form/node-form.component';
import {NodeRepository} from '../../../core/api/node.repository';
import {Button, ButtonIcon} from 'primeng/button';
import {ChevronDownIcon, ChevronRightIcon} from 'primeng/icons';
import {Ripple} from 'primeng/ripple';
import {HostRepository} from '../../../core/api/host.repository';
import {DatabaseResponse} from '../../../core/services/backend.service';
import {forkJoin} from 'rxjs';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {ConfirmationService} from 'primeng/api';
import {NodeFormService} from '../node-form/node-form.service';
import {DeleteModalComponent} from '../../../core/modals/delete-modal/delete-modal.component';
import {Badge} from 'primeng/badge';

interface GridColumn {
  field: string;
  header: string;
}

interface GridRow {
  data: NodeData;
  hostnames: HostnameData;
}

type Hostnames = { [key: string]: HostnameData };

interface HostnameData {
  active: { [key: string]: string[] };
  all: { [key: string]: string[] };
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
  ],
  providers: [
    NodeRepository,
    HostRepository,
    NodeFormService,
    ConfirmationService
  ]
})

export class GridView implements OnInit {
  constructor(@Inject(NodeRepository) private nodeRepository: NodeRepository,
              @Inject(HostRepository) private hostnameRepository: HostRepository,
              @Inject(NodeFormService) private nodeFormService: NodeFormService) {
  }

  @Input() onNodeChange: EventEmitter<[DatabaseResponse, NodeDataRequest]> = new EventEmitter();

  @ViewChild('nodeForm') nodeForm: NodeFormComponent | undefined;
  @ViewChild('deleteModalComponent') deleteModalComponent: DeleteModalComponent | undefined;

  nodes: NodeData[] = [];
  hostnames: Hostnames = {};
  rows: GridRow[] = [];

  nodeDataEdit: NodeData | undefined;

  isSavingNode: boolean = false;
  isRefreshingRows: boolean = false;
  isDeletingNode: { [key: string]: boolean } = {};

  showEditNodeModal: boolean = false;

  columns: GridColumn[] = [
    {field: 'node_unid', header: 'ID'},
    {field: 'protocol', header: 'Protocol'},
    {field: 'hostname', header: 'Hostname'},
    {field: 'port', header: 'Port'},
    {field: 'path', header: 'Path'},
  ];

  ngOnInit(): void {
    this.refreshRows();

    this.onNodeChange.subscribe(([response, nodeDataRequest]) => {
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
    });
  }

  openEditNodeModal(node?: NodeData): void {
    this.nodeDataEdit = node;
    this.showEditNodeModal = true;
  }

  closeEditNodeModal(): void {
    this.showEditNodeModal = false;
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

  async deleteNode(gridRow: GridRow): Promise<void> {
    if (this.deleteModalComponent) {
      const accepted = await this.deleteModalComponent.confirm(
        `You are about to delete node:\n${gridRow.data.node_unid}`
      );
      if (!accepted) return;

      this.isDeletingNode[gridRow.data.node_unid] = true;
      await this.nodeFormService.delete(gridRow.data, this.onNodeChange);
      delete this.isDeletingNode[gridRow.data.node_unid];
    }
  }

  updateRows(nodes: NodeData[], hostnames: Hostnames): void {
    const rowsBuilder: GridRow[] = [];
    if (!nodes) return;
    for (const node of nodes) {
      rowsBuilder.push({
        data: node,
        hostnames: hostnames[node.node_unid],
      });
    }

    this.rows = rowsBuilder;
  }
}
