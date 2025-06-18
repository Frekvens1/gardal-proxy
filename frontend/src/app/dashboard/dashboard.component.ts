import {Component, EventEmitter, OnInit} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {GridView} from '../../components/node/node-grid/node-grid.component';
import {Card} from 'primeng/card';
import {DatabaseResponse, NodeData, NodeDataRequest} from '../../openapi-client';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    GridView,
    Card,
  ],
  standalone: true
})

export class DashboardComponent implements OnInit {

  height: number = 0;
  nodeChangeEmitter = new EventEmitter<[DatabaseResponse, NodeDataRequest]>();


  constructor() {

  }

  ngOnInit(): void {
    this.height = window.innerHeight * 0.71;
  }
}
