import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../../../core/models/transaction-model';
import { BudgetService } from '../../../../core/services/budget-service';
import { StatusFilter } from '../../../shared/status-filter/status-filter';
import { NewTransaction } from "../new-transaction-component/new-transaction";
import { AuthService } from '../../../../core/services/auth-service';
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

  constructor(
    private transactionStore$: TransactionStore
  ) {
    this.transactionStore$.transactions$.subscribe((data) => {
      this.data = data;
    });
  }

  ngOnInit(): void {
    this.transactionStore$.getAllTransactions();
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

  onSubmit(dataOut: { isSubmit: boolean, isUpdate: boolean, lastTransaction: TransactionModel }) {
    this.transactions = [...this.transactions];
    if(!dataOut.isUpdate) {
      if(dataOut.isSubmit && this.data.current_page == 1) {
        if(this.transactions.length + 1 > this.data.element_per_page) this.transactions.pop();
        this.transactions.unshift(dataOut.lastTransaction);
      }
    } else {
      let updatedTransactionId = this.transactions.findIndex((transaction) => transaction.id == dataOut.lastTransaction.id);
      if(updatedTransactionId) {
        this.transactions[updatedTransactionId] = dataOut.lastTransaction;
      }
    }
    
    this.isNewTransactionOpen = false; // refermer le modal
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