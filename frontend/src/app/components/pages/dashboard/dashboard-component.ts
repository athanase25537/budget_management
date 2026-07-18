import { TransactionModel } from '../../../core/models/transaction-model';
import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MiniCard } from "../../shared/mini-card/mini-card";
import { MiniCardModel } from '../../../core/models/mini-card-model';
import { PieComponent } from "../../shared/pie-component/pie-component";
import { UserModel } from '../../../core/models/user-model';
import { StatModel } from '../../../core/models/stat-model';
import { RouterModule } from '@angular/router';
import { TransactionItemComponent } from "../transactions/transaction-item-component/transaction-item-component";
import { StatusFilter } from '../../shared/status-filter/status-filter';
import { NewTransaction } from "../transactions/new-transaction-component/new-transaction";
import { AuthService } from '../../../core/services/auth-service';
import { TransactionForm } from "../transactions/transaction-form/transaction-form";
import { TransactionStore } from '../../../core/data/transaction-store';

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
  soldeCard!: MiniCardModel;

  // loading
  isLoadingSolde$ = inject(TransactionStore).isLoadingSolde$
  isLoadingAmountIn$ = inject(TransactionStore).isLoadingAmountIn$
  isLoadingAmountOut$ = inject(TransactionStore).isLoadingAmountOut$
  isLoadingSave$ = inject(TransactionStore).isLoadingSave$

  solde$ = inject(TransactionStore).solde$;
  amountIn$ = inject(TransactionStore).amountIn$;
  amountOut$ = inject(TransactionStore).amountOut$;
  save$ = inject(TransactionStore).save$;
  saveSetting$ = inject(TransactionStore).saveSetting$;

  economy!: MiniCardModel;
  realData: StatModel = new StatModel(0, 0, 0);
  saveSetting!: number;
  totalAmountIn!: number;
  totalAmountOut!: number;
  isIn = false;
  isOpenForm = false;
  isUpdate = false;

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

  displayedFirstTransactions$ = inject(TransactionStore).displayedFirstTransactions$;

  constructor(
    private authService: AuthService,
    public transactionStore$: TransactionStore,
  ) {
    this.displayedFirstTransactions$.subscribe(data => this.data = data)
  }

  ngOnInit(): void {
    this.getAllData();
    this.transactionStore$.initializeStore();
  }

  onFilteredTransactions(result: TransactionModel[]) {
    // this.filteredTransactions = result;
  }

  onUpdateTransaction(transaction: TransactionModel) {
    this.transactionToUpdate = transaction;
    this.isOpenForm = true;
    this.isUpdate = true;
  }


  getAllData() {
    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {

      this.solde$.subscribe(solde => {
        solde = (solde !== undefined) ? solde : 0;
        this.soldeCard = new MiniCardModel(
          "Solde",
          solde,
          "fa-solid fa-money-bills text-blue-500"
        );
      });

      this.amountIn$.subscribe(amountIn => {
        amountIn = (amountIn !== undefined) ? amountIn : 0;
        this.amount_in = new MiniCardModel(
            "Earning this month",
            amountIn,
            "fa-solid text-xl fa-money-bill-trend-up text-green-500"
          );
      })

      this.amountOut$.subscribe(amountOut => {
        amountOut = (amountOut !== undefined) ? amountOut : 0;
        this.amount_out = new MiniCardModel(
            "Spent this month",
            amountOut,
            "fa-solid fa-money-bill-transfer text-red-500"
          );
      })

      this.save$.subscribe(save => {
        save = (save !== undefined) ? save : 0;
        this.saveSetting$.subscribe(saveSetting => {
          this.economy = new MiniCardModel(
            `Savings (${saveSetting}% earning)`,
            save,
            "fa-solid fa-money-bill-wheat text-orange-500"
          );
        });
      });
  
      this.realData = new StatModel(this.soldeCard.amount, this.realData.expense, this.realData.economy);

    } else {
      console.warn("Aucun utilisateur connecté !");
    }
  }
  
  updateAllData(isUpdate: boolean, lastTransaction: TransactionModel) {
    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let is_in = lastTransaction.is_in;
      let amount = lastTransaction.amount;
      let newSolde = (is_in) ? this.soldeCard.amount + amount : this.soldeCard.amount - amount;
      this.totalAmountIn += (is_in) ? amount : 0;
      this.totalAmountOut += !(is_in) ? amount : 0;

      let newSave = this.totalAmountIn * this.saveSetting / 100

      // update solde card
      this.soldeCard = new MiniCardModel(
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
    this.isUpdate = false;
  }
  
}
