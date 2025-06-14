import {Component, Inject, OnInit} from "@angular/core";
import {AddHostComponent} from '../../components/host-add/host-add.component';
import {HostRepository} from '../../core/api/host.repository';
import {Button} from 'primeng/button';
import {NodeRepository} from '../../core/api/node.repository';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    AddHostComponent,
    Button,
  ],
  standalone: true
})

export class DashboardComponent implements OnInit {

  hosts: string[] = [];
  nodes: any;

  constructor(@Inject(HostRepository) private hostRepository: HostRepository,
              @Inject(NodeRepository) private nodeRepository: NodeRepository) {

  }

  ngOnInit(): void {
    this.hostRepository.getHosts().then(hosts => {
      this.hosts = hosts;
      console.log({hosts: this.hosts});
    })

    this.nodeRepository.getNodes().then(nodes => {
      this.nodes = nodes;
      console.log({nodes: this.nodes});
    })
  }

  async createNode(): Promise<void> {
    await this.nodeRepository.updateNode({
      nodeUnid: 'XXX', ip: '127.0.0.1', port: 8080
    });
  }
}
