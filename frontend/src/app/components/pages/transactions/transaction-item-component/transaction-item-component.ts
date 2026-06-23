import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { CommonModule, DatePipe } from '@angular/common';
import { BudgetService } from '../../../../core/services/budget-service';
import { AuthService } from '../../../../core/services/auth-service';
import { TransactionStore } from '../../../../core/data/transaction-store';

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

  transactions$ = inject(TransactionStore).transactions$;

  arrayToCalculate: { id: string; value: number }[] = [];
  sum = 0;

  @Output() transactionToUpdate = new EventEmitter<TransactionModel>();

  analysis = input<boolean>(false);

  deletingTransactionIds = new Set<number>();

  constructor(
    private authService: AuthService,
    private budgetService: BudgetService,
    public transactionStore$: TransactionStore
  ) {
    effect(() => {
      const data = this.data();

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

  onDeleteTransaction(transactionId: number) {
    this.deletingTransactionIds.add(transactionId);

    // Get current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      let user_id = currentUser.id;
      this.transactionStore$.onDelete(user_id, transactionId);
    }
  }

  updateTransaction(element: HTMLElement,transaction: TransactionModel): void {
    this.transactionToUpdate.emit(transaction);
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
