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
  arrayToCalculate: { id: string; value: number }[] = [];
  sum = 0;
  @Output() transactionIdToDelete = new EventEmitter<number>();
  analysis = input<boolean>(false);

  constructor() {
    effect(() => {
      const txs = this.transactions();
      if (txs) {
        this.filteredTransactions = [...txs];
      }

      const analysis = this.analysis()
      if(!analysis) {
        this.sum = 0;
        this.arrayToCalculate = [];
      }
    });
  }

  deleteTransaction(transactionId: number): void {
    this.transactionIdToDelete.emit(transactionId)
  }
  
  calculate(el: Event) {
    const target = el.target as HTMLInputElement;
    const id = target.id;
    const value = Number(target.value);
  
    if (this.arrayToCalculate.some(e => e.id === id)) {
      this.arrayToCalculate = this.arrayToCalculate.filter(e => e.id !== id);
    } else {
      this.arrayToCalculate.push({ id, value });
    }
  
    this.sum = this.arrayToCalculate.reduce((a, b) => a + b.value, 0);
  }

  get formattedSum(): string {
    return this.sum.toLocaleString('fr-FR');
  }
  
}
