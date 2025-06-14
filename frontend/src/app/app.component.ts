import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {BackendService} from '../core/services/backend.service';
import {HostRepository} from '../core/api/host.repository';
import {NodeRepository} from '../core/api/node.repository';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
  ],
  providers: [
    BackendService,
    HostRepository,
    NodeRepository,
  ],
})
export class AppComponent {

}
