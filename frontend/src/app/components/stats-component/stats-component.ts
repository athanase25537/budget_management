import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GraphComponent } from "../graph-component/graph-component";
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { BudgetService } from '../../services/budget-service';
import { TransactionModel } from '../../models/transaction-model';
import { StatusFilter } from "../status-filter/status-filter";
import { UserModel } from '../../models/user-model';
import { StatModel } from '../../models/stat-model';

@Component({
  selector: 'app-stats-component',
  imports: [GraphComponent, TransactionItemComponent, StatusFilter],
  templateUrl: './stats-component.html',
  styleUrl: './stats-component.scss'
})
export class StatsComponent implements OnInit {

  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];
  realData: StatModel = new StatModel(0, 0, 0);

  constructor(private budgetService: BudgetService) { }
  
  ngOnInit(): void {
    this.budgetService.getAllTransaction().subscribe({
      next: (data: TransactionModel[]) => {
        this.transactions = data;
      }
    })

    this.budgetService.getUser().subscribe({
      next: (data: UserModel) => {
        this.realData = new StatModel(data.solde, this.realData.expense, this.realData.economy)
      },
      error: (err) => {
        console.log("Erreur:", err)
      }
    })

    this.budgetService.getAmountIn().subscribe({
      next: (data: any) => {
        let economy = data.amount_in*30/100;
        this.realData = new StatModel(this.realData.solde, this.realData.expense, economy);
      },
      error: (err) => {
        console.error("Erreur: ", err)
      }
    })
    
    this.budgetService.getAmountOut().subscribe({
      next: (data: any) => {
        this.realData = new StatModel(this.realData.solde, data.amount_out, this.realData.economy);
      },
      error: (err) => {
        console.error("Erreur: ", err)
      }
    })
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

}
