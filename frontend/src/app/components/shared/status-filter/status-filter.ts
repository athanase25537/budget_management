import { Component, input, EventEmitter, Output, effect, inject } from '@angular/core';
import { TransactionModel } from '../../../core/models/transaction-model';
import { CommonModule } from '@angular/common';
import { TransactionStore } from '../../../core/data/transaction-store';

@Component({
  selector: 'app-status-filter',
  imports: [CommonModule],
  templateUrl: './status-filter.html',
  styleUrl: './status-filter.scss'
})
export class StatusFilter {
  activeFilter = 'all';

  transactions$ = inject(TransactionStore).transactions$
  transactions = input.required<TransactionModel[] | null>();
  @Output() filteredTransactions = new EventEmitter<TransactionModel[]>();

  constructor(
    private transactionStore$: TransactionStore
  ) {
    this.transactions$.subscribe(data => {
      console.log("data", data);

    })
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

  filterTransactions(type: string) {
    this.transactionStore$.onFilter(type);
    this.activeFilter = type;
    console.log("type", type)
  }

}
