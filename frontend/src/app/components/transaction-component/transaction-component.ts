import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../models/transaction-model';
import { BudgetService } from '../../services/budget-service';
import { StatusFilter } from '../status-filter/status-filter';
import { NewTransaction } from "../new-transaction/new-transaction";
import { AuthService } from '../../services/auth-service';

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
  
  constructor(private budgetService: BudgetService, private authService: AuthService) { }
  
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
    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let user_id = currentUser.id;
      this.budgetService.deleteTransaction(user_id, transactionId).subscribe({
        next: (data: any) => {
          this.getAllData()
        },
        error: (err) => {
          console.log("error:", err)
        }
      })
    }
  }

  getAllData() {
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let user_id = currentUser.id;

      this.budgetService.getAllTransaction(user_id).subscribe({
        next: (data: TransactionModel[]) => {
          this.transactions = data;
        },
        error: (err) => {
          console.log("Erreur:", err)
        }
      })
    }
  }

  openNewTransactionModal() {
    this.isNewTransactionOpen = !this.isNewTransactionOpen;
  }

  closeNewTransactionModal() {
    this.isNewTransactionOpen = false;
  }

}