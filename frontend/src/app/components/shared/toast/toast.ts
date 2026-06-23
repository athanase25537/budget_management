import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class Toast {
  toast: { type: string, message: string} = { type: "error", message: "Ceci est un test"}

  constructor(public readonly toastService: ToastService) { }
}
