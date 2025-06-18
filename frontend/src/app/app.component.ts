import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {BackendService} from '../core/services/backend.service';
import {Toast} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {UserAgentService} from '../core/services/user-agent.service';
import {DefaultService as BackendApi} from '../openapi-client';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
    Toast,
  ],
  providers: [
    HttpClient,
    BackendApi,
    BackendService,
    UserAgentService,
    MessageService,
  ],
})
export class AppComponent {

}
