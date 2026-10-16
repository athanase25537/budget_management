import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

type ToastType = 'create' | 'delete' | 'error' | 'success' | 'update';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private readonly messageService: MessageService) {}

  show(data: { type: ToastType; message: string }): void {
    const severity = data.type === 'error' ? 'error' : data.type === 'update' ? 'info' : 'success';
    const summary = data.type === 'error' ? 'Action failed' : data.type === 'update' ? 'Updated' : 'Success';

    this.messageService.add({ severity, summary, detail: data.message, life: 3500 });
  }
}
