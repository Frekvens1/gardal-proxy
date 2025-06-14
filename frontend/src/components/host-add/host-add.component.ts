import {Component, Input, OnInit} from "@angular/core";
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {InputText} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {Panel} from 'primeng/panel';


@Component({
  selector: 'host-add',
  templateUrl: './host-add.component.html',
  styleUrls: ['./host-add.component.scss'],
  imports: [
    InputGroup,
    InputGroupAddon,
    InputText,
    FormsModule,
    ToggleSwitch,
    Panel
  ],
  standalone: true
})

export class AddHostComponent implements OnInit {

  @Input() unid: string = '';
  @Input() hostname: string = '';
  @Input() redirectUrl: string = '';
  @Input() wildcard: boolean = false;

  constructor() {
  }

  ngOnInit(): void {

  }
}
