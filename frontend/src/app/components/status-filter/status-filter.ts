import { Component, input, EventEmitter, Output, effect } from '@angular/core';
import { TransactionModel } from '../../models/transaction-model';

@Component({
  selector: 'app-status-filter',
  imports: [],
  templateUrl: './status-filter.html',
  styleUrl: './status-filter.scss'
})
export class StatusFilter {

  transactions = input.required<TransactionModel[]>();
  @Output() filteredTransactions = new EventEmitter<TransactionModel[]>();

  constructor() {
    effect(() => {
      const txs = this.transactions();
      if (txs) {
        this.filteredTransactions.emit([...txs]);
      }
    });
  }

  getAllTransactionIn() {
    let transactionIn = this.transactions().filter(el => el.is_in)
    this.filteredTransactions.emit([...transactionIn])
  }

  getAllTransactionOut() {
    let transactionIn = this.transactions().filter(el => !el.is_in)
    this.filteredTransactions.emit([...transactionIn])
  }

  getAllTransactions() {
    this.filteredTransactions.emit([...this.transactions()])
  }

}
