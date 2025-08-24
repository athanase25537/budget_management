import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../models/transaction-model';
import { BudgetService } from '../../services/budget-service';
import { StatusFilter } from '../status-filter/status-filter';
import { NewTransaction } from "../new-transaction/new-transaction";

@Component({
  selector: 'app-transaction-component',
  imports: [CommonModule, TransactionItemComponent, StatusFilter, NewTransaction],
  templateUrl: './transaction-component.html',
  styleUrl: './transaction-component.scss'
})
export class TransactionComponent implements OnInit {
  
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];
  isNewTransactionOpen = false;
  
  constructor(private budgetService: BudgetService) { }
  
  ngOnInit(): void {
    this.getAllData()
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

  onSubmit() {
    this.getAllData();
    this.isNewTransactionOpen = false; // refermer le modal
  }

  onDeleteTransaction(transactionId: number) {
    this.budgetService.deleteTransaction(1, transactionId).subscribe({
      next: (data: any) => {
        this.getAllData()
      },
      error: (err) => {
        console.log("error:", err)
      }
    })
  }

  getAllData() {
    this.budgetService.getAllTransaction().subscribe({
      next: (data: TransactionModel[]) => {
        this.transactions = data;
      },
      error: (err) => {
        console.log("Erreur:", err)
      }
    })
  }

  openNewTransactionModal() {
    this.isNewTransactionOpen = !this.isNewTransactionOpen;
  }

  closeNewTransactionModal() {
    this.isNewTransactionOpen = false;
  }

}