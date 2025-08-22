import { Component, effect, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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

  constructor() {
    effect(() => {
      const txs = this.transactions();
      if (txs) {
        console.log("Transactions prêtes:", txs);
        this.filteredTransactions = [...txs];
      }
    });
  }
  
}
