import { Component, OnInit } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../models/transaction-model';
import { BudgetService } from '../../services/budget-service';
import { StatusFilter } from '../status-filter/status-filter';

@Component({
  selector: 'app-transaction-component',
  imports: [TransactionItemComponent, StatusFilter],
  templateUrl: './transaction-component.html',
  styleUrl: './transaction-component.scss'
})
export class TransactionComponent implements OnInit {
  
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];
  
  constructor(private budgetService: BudgetService) { }
  
  ngOnInit(): void {
    this.budgetService.getAllTransaction().subscribe({
      next: (data: TransactionModel[]) => {
        this.transactions = data;
      }
    })
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }
}