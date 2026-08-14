import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { CommonModule, DatePipe } from '@angular/common';
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

  itemLoading$ = inject(TransactionStore).itemLoading$;

  totalPage!: number;
  readonly itemsPerPageOptions = [5, 10, 20, 50];

  arrayToCalculate: { id: string; value: number }[] = [];
  sum = 0;

  @Output() transactionToUpdate = new EventEmitter<TransactionModel>();

  analysis = input<boolean>(false);

  deletingTransactionIds = new Set<number>();

  constructor(
    private authService: AuthService,
    public transactionStore$: TransactionStore
  ) {

    effect(() => {
      const data = this.data();

      if(data) {
        this.data().element_per_page = data.element_per_page;

        this.totalPage = Math.max(1, Math.ceil(data.total / data.element_per_page));
      }

      const analysis = this.analysis()
      if(!analysis) {
        this.sum = 0;
        this.arrayToCalculate = [];
      }
    });

  }

  previousPage() {
    if (!this.data().has_previous_page) return;

    this.transactionStore$.getAllTransactions(this.data().current_page - 1);
  }

  nextPage() {
    if (!this.data().has_next_page) return;

    this.transactionStore$.getAllTransactions(this.data().current_page + 1);
  }

  goToLastPage() {
    this.goToPage(this.totalPage);
  }

  goToFirstPage() {
    this.goToPage(1);
  }

  goToPage(page: string | number | HTMLInputElement) {
    const pageInput = page instanceof HTMLInputElement ? page : undefined;
    const requestedPage = pageInput ? pageInput.valueAsNumber : Number(page);

    if (
      !Number.isInteger(requestedPage)
      || requestedPage < 1
      || requestedPage > this.totalPage
    ) {
      if (pageInput) {
        pageInput.setCustomValidity(`La page doit être comprise entre 1 et ${this.totalPage}.`);
        pageInput.reportValidity();
        pageInput.setCustomValidity('');
        pageInput.value = String(this.data().current_page);
      }
      return;
    }

    if (requestedPage === this.data().current_page) return;

    this.transactionStore$.getAllTransactions(requestedPage);
  }

  changeItemsPerPage(itemsPerPage: string) {
    this.transactionStore$.setTransactionItemsPerPage(Number(itemsPerPage));
  }

  onDeleteTransaction(transactionId: number) {
    this.deletingTransactionIds.add(transactionId);

    // Get current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.transactionStore$.onDelete(transactionId);
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
