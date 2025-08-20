import { Component } from '@angular/core';
import { TransactionItemComponent } from "../transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../models/transaction-model';
import { BudgetService } from '../../services/budget-service';

@Component({
  selector: 'app-transaction-component',
  imports: [TransactionItemComponent],
  templateUrl: './transaction-component.html',
  styleUrl: './transaction-component.scss'
})
export class TransactionComponent {
  
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
