import { Component, effect, EventEmitter, input, Output } from '@angular/core';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { CommonModule, DatePipe } from '@angular/common';
import { BudgetService } from '../../../../core/services/budget-service';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-transaction-item-component',
  imports: [DatePipe, CommonModule],
  templateUrl: './transaction-item-component.html',
  styleUrl: './transaction-item-component.scss'
})
export class TransactionItemComponent {

  data = input.required<{
    transactions: TransactionModel[],
    has_next_page: boolean,
    has_previous_page: boolean,
    current_page: number,
    element_per_page: number,
    total: number,
    need_footer: boolean,
  }>();

  totalPage!: number;

  transactions = input.required<TransactionModel[]>();
  filteredTransactions!: TransactionModel[];
  arrayToCalculate: { id: string; value: number }[] = [];
  sum = 0;

  @Output() transactionIdToDelete = new EventEmitter<number>();
  @Output() transactionIdToUpdate = new EventEmitter<number>();

  analysis = input<boolean>(false);

  deletingTransactionIds = new Set<number>();

  constructor(
    private authService: AuthService,
    private budgetService: BudgetService
  ) {
    effect(() => {
      const txs = this.transactions();
      const data = this.data();

      if (txs) {
        this.filteredTransactions = [...txs];
      }

      if(data) {
        this.data().element_per_page = data.element_per_page;

        this.totalPage = Math.ceil(data.total / data.element_per_page);
      }

      const analysis = this.analysis()
      if(!analysis) {
        this.sum = 0;
        this.arrayToCalculate = [];
      }
    });
  }

  previousPage() {
    const currentUser = this.authService.getCurrentUser();
    let page = this.data()?.current_page

    if (currentUser && this.data().has_previous_page) {
      let user_id = currentUser.id;
      
      if(page) page -= 1;
      
      this.budgetService.getAllTransactionByUserId(user_id, page).subscribe({
        next: (data: any) => {
          this.filteredTransactions = [...this.filteredTransactions];
          this.filteredTransactions = data.transactions;

          this.data().has_next_page = data.has_next_page;
          this.data().has_previous_page = data.has_previous_page;
          this.data().current_page = data.current_page;
        },
        error: (err: any) => {
          console.log("Error:", err);
        }
      })
    }
  }

  nextPage() {
    if(!this.data().has_next_page) return;

    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      let user_id = currentUser.id;
      
      let page = this.data()?.current_page
      if(page) page += 1;
      
      this.budgetService.getAllTransactionByUserId(user_id, page).subscribe({
        next: (data: any) => {
          this.filteredTransactions = [...this.filteredTransactions];
          this.filteredTransactions = data.transactions;

          this.data().has_next_page = data.has_next_page;
          this.data().has_previous_page = data.has_previous_page;
          this.data().current_page = data.current_page;
          this.data().element_per_page = data.element_per_page;

          this.totalPage = Math.ceil(data.total / data.element_per_page);
        },
        error: (err: any) => {
          console.log("Error:", err);
        }
      })
    }
  }

  deleteTransaction(transactionId: number): void {
    this.deletingTransactionIds.add(transactionId);
    this.transactionIdToDelete.emit(transactionId);
  }

  updateTransaction(element: HTMLElement,transactionId: number): void {
    this.deletingTransactionIds.add(transactionId);
    element.classList.add('opacity-50', 'pointer-events-none');
    this.transactionIdToUpdate.emit(transactionId);
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
