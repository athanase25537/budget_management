import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-new-transaction',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './new-transaction.html',
  styleUrl: './new-transaction.scss'
})

export class NewTransaction {

  is_in!: boolean;
  isTypeNormal = input<boolean>(true);
  @Output() openForm = new EventEmitter<boolean>();

  errorMessage = ''; // Message d’erreur affiché dans le template

  newTransaction(isIn: boolean) {
    this.openForm.emit(isIn);
  }
}
