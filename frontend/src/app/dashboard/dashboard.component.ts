import {Component, Inject, OnInit} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HostRepository} from '../../core/api/host.repository';
import {NodeRepository} from '../../core/api/node.repository';
import {BackendService, DatabaseResponse} from '../../core/services/backend.service';
import {NodeData, NodeFormComponent} from '../../components/node/node-form/node-form.component';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NodeFormComponent,
  ],
  providers: [
    BackendService,
    HostRepository,
    NodeRepository,
  ],
  standalone: true
})

export class DashboardComponent implements OnInit {

  hosts: string[] = [];
  nodes: NodeData[] = [];

  constructor(@Inject(HostRepository) private hostRepository: HostRepository,
              @Inject(NodeRepository) private nodeRepository: NodeRepository) {

  }

  ngOnInit(): void {
    forkJoin({
      hosts: this.hostRepository.getHosts(),
      nodes: this.nodeRepository.getNodes(),
    }).subscribe((result) => {
      console.info({
        nodes: result.nodes,
        hosts: result.hosts,
      });

      this.hosts = result.hosts;
      this.nodes = result.nodes;
    });
  }

  onNodeChange(event: [DatabaseResponse, NodeData]) {
    const [response, nodeData] = event;
    switch (response) {
      case 'CREATED':
        this.nodes.push(nodeData);
        break;

      case 'DELETED':
        const index = this.nodes.findIndex(node => node.node_unid === nodeData.node_unid);
        if (index !== -1) {
          this.nodes.splice(index, 1);
        }
        break;
    }
  }
}
