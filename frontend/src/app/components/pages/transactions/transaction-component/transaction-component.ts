import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../../../core/models/transaction-model';
import { StatusFilter } from '../../../shared/status-filter/status-filter';
import { NewTransaction } from "../new-transaction-component/new-transaction";
import { FormsModule } from '@angular/forms';
import { TransactionForm } from '../transaction-form/transaction-form';
import { TransactionStore } from '../../../../core/data/transaction-store';

@Component({
  selector: 'app-transaction-component',
  imports: [CommonModule, TransactionItemComponent, StatusFilter, NewTransaction, FormsModule, TransactionForm],
  templateUrl: './transaction-component.html',
  styleUrl: './transaction-component.scss'
})
export class TransactionComponent implements OnInit {

  transactionToUpdate!: TransactionModel;
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];
  isNewTransactionOpen = false;
  analysis = false;
  isIn = false;
  isOpenForm = false;
  isUpdate = false;

  data!: {
    transactions: TransactionModel[],
    has_next_page: boolean,
    has_previous_page: boolean,
    current_page: number,
    element_per_page: number,
    total: number,
    need_footer: boolean
  };

  displayedTransactions$ = inject(TransactionStore).displayedTransactions$;
  constructor(
    private transactionStore$: TransactionStore
  ) {
    this.displayedTransactions$.subscribe((data) => {
      this.data = data;
    });
  }

  ngOnInit(): void {
    this.transactionStore$.getAllTransactions();
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  } 

  openNewTransactionModal() {
    this.isNewTransactionOpen = !this.isNewTransactionOpen;
  }

  closeNewTransactionModal() {
    this.isNewTransactionOpen = false;
  }

  onAnalysisChange() {
    this.analysis = !this.analysis;
  }

  openForm(isIn: boolean) {
    this.isOpenForm = true;
    this.isIn = isIn;
  }

  onCloseForm() {
    this.isOpenForm = false;
    this.isUpdate = false;
  }

  onUpdateTransaction(transaction: TransactionModel) {
    this.transactionToUpdate = transaction;
    this.isOpenForm = true;
    this.isUpdate = true;
  }
}