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

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MiniCard, PieComponent, RouterModule, TransactionItemComponent, StatusFilter],
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

  constructor(private budgetService: BudgetService, private fb: FormBuilder) { }

  ngOnInit(): void {

    this.transactionForm = this.fb.group({
      amount: [0, Validators.required],
      reason: ['', Validators.required],
      is_in: [true, Validators.required]
    });

    this.updateAllData()
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitForm() {
    let amount = this.transactionForm.value.amount
    let reason = this.transactionForm.value.reason
    let is_in = this.transactionForm.value.is_in

    console.log("ON EST ICIIIIII")
    this.newTransaction = new TransactionModel(
      new Date().toISOString(),
      amount,
      is_in,
      0,
      1,
      reason
    )

    this.budgetService.addTransaction(this.newTransaction).subscribe({
      next: (data) => {
        console.log(data)
        this.updateAllData()
      },
      error: (err) => {
        console.log(err)
      }
    })

    this.closeModal(); 
  }

  onFilteredTransactions(result: TransactionModel[]) {
    this.filteredTransactions = result;
  }

  updateAllData() {
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
      },
      error: (err) => {
        console.log("Erreur: ", err)
      }
    })
  }
}
