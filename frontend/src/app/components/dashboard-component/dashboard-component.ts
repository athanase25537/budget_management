import { SettingsService } from './../../services/settings-service';
import { TransactionModel } from './../../models/transaction-model';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MiniCard } from "../mini-card/mini-card";
import { MiniCardModel } from '../../models/mini-card-model';
import { PieComponent } from "../pie-component/pie-component";
import { BudgetService } from '../../services/budget-service';
import { UserModel } from '../../models/user-model';
import { StatModel } from '../../models/stat-model';
import { RouterModule } from '@angular/router';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { StatusFilter } from '../status-filter/status-filter';
import { NewTransaction } from "../new-transaction/new-transaction";
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MiniCard, PieComponent, RouterModule, TransactionItemComponent, StatusFilter, NewTransaction],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})

export class DashboardComponent implements OnInit {

  transactionForm!: FormGroup;
  user!: UserModel;
  amount_in!: MiniCardModel;
  amount_out!: MiniCardModel;
  solde!: MiniCardModel;
  economy!: MiniCardModel;
  realData: StatModel = new StatModel(0, 0, 0);
  
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];

  isModalOpen = false;
  newTransaction!: TransactionModel;
  is_in = true;

  constructor(
    private budgetService: BudgetService,
    private authService: AuthService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.updateAllData();
  
    // S'abonner une seule fois aux settings
    this.settingsService.settings$.subscribe(settings => {
      if (settings) {
        let eco = settings.economy ?? 0;
  
        // Recalcul de l’économie basé sur `amount_in`
        let amount_in = this.amount_in?.amount ?? 0;
        let economy = amount_in * eco / 100;
        this.economy = new MiniCardModel(
          `Savings (${eco}% earning)`,
          economy,
          "fa-solid fa-money-bill-wheat text-orange-500"
        );
  
        // Mettre à jour les stats globales
        this.realData = new StatModel(this.realData.solde, this.realData.expense, economy);
      }
    });
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
          this.updateAllData()
        },
        error: (err) => {
          console.log("error:", err)
        }
      })
    }
  }

  onSubmit(event: boolean) {
    this.updateAllData()
  }

  updateAllData() {
    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let user_id = currentUser.id;
  
      this.budgetService.getUser(user_id).subscribe({
        next: (data: any) => {
          this.user = data;
          this.solde = new MiniCardModel(
            "Solde",
            data.solde,
            "fa-solid fa-money-bills text-blue-500"
          );
  
          this.realData = new StatModel(data.solde, this.realData.expense, this.realData.economy);

          // 🔄 recalcul économie directement après avoir reçu amount_in
          this.settingsService.getSettings(user_id).subscribe(settings => {
            if (settings) {
              let eco = settings.economy ?? 0;  
              let economy = data.amount_in * eco / 100;
            }
          });
        },
        error: (err) => {
          console.error('Erreur:', err);
        }
      });
  
      this.budgetService.getAmountIn(user_id).subscribe({
        next: (data: any) => {
          let amount_in = (data.amount_in) ? data.amount_in : 0;
          this.amount_in = new MiniCardModel(
            "Earning this month",
            amount_in,
            "fa-solid text-xl fa-money-bill-trend-up text-green-500"
          );
        },
        error: (err) => {
          console.error("Erreur: ", err);
        }
      });
  
      this.budgetService.getAmountOut(user_id).subscribe({
        next: (data: any) => {
          this.amount_out = new MiniCardModel(
            "Spent this month",
            data.amount_out,
            "fa-solid fa-money-bill-transfer text-red-500"
          );
  
          this.realData = new StatModel(this.realData.solde, data.amount_out, this.realData.economy);
        },
        error: (err) => {
          console.error("Erreur: ", err);
        }
      });
  
      this.budgetService.getAllTransaction(user_id).subscribe({
        next: (data: TransactionModel[]) => {
          this.transactions = data.slice(0, 10);
        },
        error: (err) => {
          console.log("Erreur: ", err);
        }
      });
    } else {
      console.warn("Aucun utilisateur connecté !");
    }
  }
  
}
