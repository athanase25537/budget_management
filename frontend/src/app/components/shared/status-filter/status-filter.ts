import { Component, input, EventEmitter, Output, effect } from '@angular/core';
import { TransactionModel } from '../../../core/models/transaction-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-filter',
  imports: [CommonModule],
  templateUrl: './status-filter.html',
  styleUrl: './status-filter.scss'
})
export class StatusFilter {
  activeFilter = 'all';

  transactions = input.required<TransactionModel[] | null>();
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
    let transactionIn = this.transactions()?.filter(el => el.is_in);
    if(transactionIn) this.filteredTransactions.emit([...transactionIn]);
    this.activeFilter = 'is_in';
  }

  getAllTransactionOut() {
    let transactionIn = this.transactions()?.filter(el => !el.is_in);
    if(transactionIn) this.filteredTransactions.emit([...transactionIn]);
    this.activeFilter = 'is_out';
  }

  getAllTransactions() {
    // if(this.transactions()) this.filteredTransactions.emit([...this.transactions()]);
    this.activeFilter = 'all';
  }

}
