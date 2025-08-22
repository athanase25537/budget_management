import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GraphComponent } from "../graph-component/graph-component";
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { BudgetService } from '../../services/budget-service';
import { TransactionModel } from '../../models/transaction-model';
import { StatusFilter } from "../status-filter/status-filter";

@Component({
  selector: 'app-stats-component',
  imports: [GraphComponent, TransactionItemComponent, StatusFilter],
  templateUrl: './stats-component.html',
  styleUrl: './stats-component.scss'
})
export class StatsComponent implements OnInit {

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
