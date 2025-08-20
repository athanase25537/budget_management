import { Component, Input } from '@angular/core';
import { TransactionModel } from '../../models/transaction-model';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transaction-item-component',
  imports: [DatePipe, CommonModule],
  templateUrl: './transaction-item-component.html',
  styleUrl: './transaction-item-component.scss'
})
export class TransactionItemComponent {
  @Input() transactions!: TransactionModel[];
}
