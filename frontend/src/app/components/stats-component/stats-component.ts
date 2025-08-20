import { Component, OnInit } from '@angular/core';
import { GraphComponent } from "../graph-component/graph-component";
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { BudgetService } from '../../services/budget-service';
import { TransactionModel } from '../../models/transaction-model';

@Component({
  selector: 'app-stats-component',
  imports: [GraphComponent, TransactionItemComponent],
  templateUrl: './stats-component.html',
  styleUrl: './stats-component.scss'
})
export class StatsComponent implements OnInit {

  allTransactions!: TransactionModel[];
  constructor(private budgetService: BudgetService) { }
  
  ngOnInit(): void {
    this.budgetService.getAllTransaction().subscribe({
      next: (data: TransactionModel[]) => {
        this.allTransactions = data;
      }
    })
  }

}
