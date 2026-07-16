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
  isFirstTransaction = input.required<boolean>();

  @Output() filteredTransactions = new EventEmitter<TransactionModel[]>();

  constructor(
    private transactionStore$: TransactionStore
  ) {  }

  filterTransactions(type: string) {
    if(this.isFirstTransaction()) this.transactionStore$.onFilterFirstTransaction(type);
    else this.transactionStore$.onFilterTransaction(type);
    
    this.activeFilter = type;
  }

}
