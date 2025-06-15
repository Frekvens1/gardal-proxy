import {Component, Inject} from "@angular/core";
import {Button, ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';

@Component({
  selector: 'delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [
    Button,
    ConfirmDialog,
    ButtonModule,
    ToastModule
  ],
  providers: [
    ConfirmationService,
  ],
  standalone: true
})

export class DeleteModalComponent {


  constructor(@Inject(ConfirmationService) private confirmationService: ConfirmationService) {

  }

  async confirm(message?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.confirmationService.confirm({
        header: 'Are you sure?',
        message: message || 'Please confirm to delete.',
        accept: () => {
          resolve(true);
        },
        reject: () => {
          resolve(false)
        },
      });
    });
  }
}
