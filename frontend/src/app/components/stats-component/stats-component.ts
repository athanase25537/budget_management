import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GraphComponent } from "../graph-component/graph-component";
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { BudgetService } from '../../services/budget-service';
import { TransactionModel } from '../../models/transaction-model';
import { StatusFilter } from "../status-filter/status-filter";
import { UserModel } from '../../models/user-model';
import { StatModel } from '../../models/stat-model';
import { AuthService } from '../../services/auth-service';

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

  constructor(private budgetService: BudgetService, private authService: AuthService) { }
  
  ngOnInit(): void {
    
    this.getAllData();

  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
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
    // Récupérer l'utilisateur courant
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

      this.budgetService.getUser(user_id).subscribe({
        next: (data: UserModel) => {
          this.realData = new StatModel(data.solde, this.realData.expense, this.realData.economy)
        },
        error: (err) => {
          console.log("Erreur:", err)
        }
      })
  
      this.budgetService.getAmountIn(user_id).subscribe({
        next: (data: any) => {
          let economy = data.amount_in*30/100;
          this.realData = new StatModel(this.realData.solde, this.realData.expense, economy);
        },
        error: (err) => {
          console.error("Erreur: ", err)
        }
      })
      
      this.budgetService.getAmountOut(user_id).subscribe({
        next: (data: any) => {
          this.realData = new StatModel(this.realData.solde, data.amount_out, this.realData.economy);
        },
        error: (err) => {
          console.error("Erreur: ", err)
        }
      })
    }
  }

}
