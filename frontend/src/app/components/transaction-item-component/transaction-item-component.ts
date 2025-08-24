import { Component, effect, EventEmitter, input, Output } from '@angular/core';
import { TransactionModel } from '../../models/transaction-model';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transaction-item-component',
  imports: [DatePipe, CommonModule],
  templateUrl: './transaction-item-component.html',
  styleUrl: './transaction-item-component.scss'
})
export class TransactionItemComponent {

  transactions = input.required<TransactionModel[]>();
  filteredTransactions!: TransactionModel[];
  @Output() transactionIdToDelete = new EventEmitter<number>();
  
  constructor() {
    effect(() => {
      const txs = this.transactions();
      if (txs) {
        console.log("Transactions prêtes:", txs);
        this.filteredTransactions = [...txs];
      }
    });
  }

  deleteTransaction(transactionId: number): void {
    console.log("here transaction_id:", transactionId)
    this.transactionIdToDelete.emit(transactionId)
  }
  
}
