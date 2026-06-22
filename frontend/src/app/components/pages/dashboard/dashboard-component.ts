import { SettingsService } from '../../../core/services/settings-service';
import { TransactionModel } from '../../../core/models/transaction-model';
import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MiniCard } from "../../shared/mini-card/mini-card";
import { MiniCardModel } from '../../../core/models/mini-card-model';
import { PieComponent } from "../../shared/pie-component/pie-component";
import { BudgetService } from '../../../core/services/budget-service';
import { UserModel } from '../../../core/models/user-model';
import { StatModel } from '../../../core/models/stat-model';
import { RouterModule } from '@angular/router';
import { TransactionItemComponent } from "../transactions/transaction-item-component/transaction-item-component";
import { StatusFilter } from '../../shared/status-filter/status-filter';
import { NewTransaction } from "../transactions/new-transaction-component/new-transaction";
import { AuthService } from '../../../core/services/auth-service';
import { TransactionForm } from "../transactions/transaction-form/transaction-form";

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MiniCard, PieComponent, RouterModule, TransactionItemComponent, StatusFilter, TransactionForm, NewTransaction],
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
  saveSetting!: number;
  totalAmountIn!: number;
  totalAmountOut!: number;
  isIn!: boolean;
  isOpenForm = false;
  isUpdate = false;
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];

  transactionToUpdate!: TransactionModel;
  isOpenExtModal: boolean = false;
  newTransaction!: TransactionModel;
  is_in = true;

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
    private budgetService: BudgetService,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {  }

  ngOnInit(): void {
    this.getAllData();
  }
  

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

  onUpdateTransaction(transaction: TransactionModel) {
    this.transactionToUpdate = transaction;
    this.isOpenForm = true;
    this.isUpdate = true;
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

  onSubmit(dataOut: { isSubmit: boolean, lastTransaction: TransactionModel }) {
    if(dataOut.isSubmit) {
      this.updateAllData(dataOut.lastTransaction)
    }
  }

  getAllData() {
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
        },
        error: (err) => {
          console.error('Erreur:', err);
        }
      });
  
      // Get all amount in
      this.budgetService.getAmountIn(user_id).subscribe({
        next: (data: any) => {
          this.totalAmountIn = (data.amount_in) ? data.amount_in : 0;

          this.amount_in = new MiniCardModel(
            "Earning this month",
            this.totalAmountIn,
            "fa-solid text-xl fa-money-bill-trend-up text-green-500"
          );
        },
        error: (err) => {
          console.error("Erreur: ", err);
        }
      });
  
      // Get all amount out
      this.budgetService.getAmountOut(user_id).subscribe({
        next: (data: any) => {
          this.totalAmountOut = (data.amount_out) ? data.amount_out : 0;
          this.amount_out = new MiniCardModel(
            "Spent this month",
            this.totalAmountOut,
            "fa-solid fa-money-bill-transfer text-red-500"
          );
  
          this.realData = new StatModel(this.realData.solde, data.amount_out, this.realData.economy);

          // recalcul économie directement après avoir reçu amount_in
          this.settingsService.settings$.subscribe(settings => {
            if (settings) {
              this.saveSetting = settings.economy ?? 0;
        
              // Recalcul de l’économie basé sur `amount_in`
              this.totalAmountIn = this.amount_in?.amount ?? 0;
              let economy = this.totalAmountIn * this.saveSetting / 100;
              this.economy = new MiniCardModel(
                `Savings (${this.saveSetting}% earning)`,
                economy,
                "fa-solid fa-money-bill-wheat text-orange-500"
              );
        
              // Mettre à jour les stats globales
              this.realData = new StatModel(this.realData.solde, this.realData.expense, economy);
            }
          });
        },
        error: (err) => {
          console.error("Erreur: ", err);
        }
      });
  
      this.budgetService.getFirstTenTransactions(user_id).subscribe({
        next: (data: TransactionModel[]) => {
          this.transactions = data;
          console.log("dd", data.length)
        },
        error: (err) => {
          console.log("Erreur: ", err);
        }
      });
    } else {
      console.warn("Aucun utilisateur connecté !");
    }
  }
  
  updateAllData(lastTransaction: TransactionModel) {
    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let is_in = lastTransaction.is_in;
      let amount = lastTransaction.amount;
      let newSolde = (is_in) ? this.solde.amount + amount : this.solde.amount - amount;
      this.totalAmountIn += (is_in) ? amount : 0;
      this.totalAmountOut += !(is_in) ? amount : 0;

      let newSave = this.totalAmountIn * this.saveSetting / 100

      // update solde card
      this.solde = new MiniCardModel(
        "Solde",
        newSolde,
        "fa-solid fa-money-bills text-blue-500"
      );

      // update economy card
      this.economy = new MiniCardModel(
        `Savings (${this.saveSetting}% earning)`,
        newSave,
        "fa-solid fa-money-bill-wheat text-orange-500"
      );

      // update amount out card
      this.amount_out = new MiniCardModel(
        "Spent this month",
        this.totalAmountOut,
        "fa-solid fa-money-bill-transfer text-red-500"
      );

      // update amount in card
      this.amount_in = new MiniCardModel(
        "Earning this month",
        this.totalAmountIn,
        "fa-solid text-xl fa-money-bill-trend-up text-green-500"
      );

      // update transactions
      let newTransactions = [...this.transactions];
      newTransactions.unshift(lastTransaction);
      if(newTransactions.length > 10) newTransactions.pop();
      this.transactions = newTransactions;
      this.filteredTransactions = newTransactions;

      // update real data for graph
      this.realData = new StatModel(newSolde, this.totalAmountOut, newSave);
    } else {
      console.warn("Aucun utilisateur connecté !");
    }
  }

  openForm(isIn: boolean) {
    this.isOpenForm = true;
    this.isIn = isIn;
  }

  onCloseForm() {
    this.isOpenForm = false;
  }

  onUpdate() {

  }
}
