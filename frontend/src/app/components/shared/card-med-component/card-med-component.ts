import { Component, input } from '@angular/core';
import { MiniCardModel } from '../../../core/models/mini-card-model';
import { TransactionItemComponent } from "../../pages/transactions/transaction-item-component/transaction-item-component";
import { TransactionModel } from '../../../core/models/transaction-model';

@Component({
  selector: 'app-card-med-component',
  imports: [TransactionItemComponent],
  templateUrl: './card-med-component.html',
  styleUrl: './card-med-component.scss'
})
export class CardMedComponent {

  transactionInput = input.required<TransactionModel[]>()

  myMedCard = input<MiniCardModel>(
    new MiniCardModel(
    "Spent this month",
    50000,
    "fa-solid text-xl fa-money-bill-trend-up"
  )
);
}
