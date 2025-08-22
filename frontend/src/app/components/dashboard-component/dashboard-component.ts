import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MiniCard } from "../mini-card/mini-card";
import { MiniCardModel } from '../../models/mini-card-model';
import { PieComponent } from "../pie-component/pie-component";
import { BudgetService } from '../../services/budget-service';
import { UserModel } from '../../models/user-model';
import { StatModel } from '../../models/stat-model';
import { TransactionModel } from '../../models/transaction-model';
import { RouterModule } from '@angular/router';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { StatusFilter } from '../status-filter/status-filter';

@Component({
  selector: 'app-dashboard-component',
  imports: [CommonModule, MiniCard, PieComponent, RouterModule, TransactionItemComponent, StatusFilter],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent implements OnInit {

  user!: UserModel;
  amount_in!: MiniCardModel;
  amount_out!: MiniCardModel;
  solde!: MiniCardModel;
  economy!: MiniCardModel;
  realData: StatModel = new StatModel(0, 0, 0);
  
  transactions!: TransactionModel[];
  filteredTransactions!: TransactionModel[];

  isModalOpen = false;

  // formData = {
  //   amount: number,
  //   reason: string
  // };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitForm() {
    // console.log("Nouvelle transaction :", this.formData);

    // 👉 tu peux ici envoyer la donnée à ton backend ou l'ajouter dans ton tableau de transactions
    // ex: this.transactions.push({...this.formData});

    this.closeModal(); // referme après envoi
  }

  constructor(private budgetService: BudgetService) { }

  ngOnInit(): void {

    this.budgetService.getUser().subscribe({
      next: (data: any) => {
        this.user = data
        this.solde = new MiniCardModel(
          "Solde",
          data.solde,
          "fa-solid fa-money-bills text-blue-500"
        )

        this.realData = new StatModel(data.solde, this.realData.expense, this.realData.economy);
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    })

    this.budgetService.getAmountIn().subscribe({
      next: (data: any) => {
        console.log("amount in: ", data.amount_in)
        this.amount_in = new MiniCardModel(
          "Earning this month",
          data.amount_in,
          "fa-solid text-xl fa-money-bill-trend-up text-green-500"
        )

        let economy = data.amount_in*30/100;
        this.economy = new MiniCardModel(
          "Economy (30% earning)",
          economy,
          "fa-solid fa-money-bill-wheat text-orange-500"
        )

        this.realData = new StatModel(this.realData.solde, this.realData.expense, economy);
      },
      error: (err) => {
        console.error("Erreur: ", err)
      }
    })

    this.budgetService.getAmountOut().subscribe({
      next: (data: any) => {
        console.log("amount out: ", data.amount_out)
        this.amount_out = new MiniCardModel(
          "Spent this month",
          data.amount_out,
          "fa-solid fa-money-bill-transfer text-red-500"
        )

        this.realData = new StatModel(this.realData.solde, data.amount_out, this.realData.economy);
      },
      error: (err) => {
        console.error("Erreur: ", err)
      }
    })

    this.budgetService.getAllTransaction().subscribe({
      next: (data: TransactionModel[]) => {
        this.transactions = data.slice(0, 10);
      }
    })
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

}
