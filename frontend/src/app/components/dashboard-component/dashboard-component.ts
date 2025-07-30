import { Component, input } from '@angular/core';
import { MiniCard } from "../mini-card/mini-card";
import { MiniCardModel } from '../../models/mini-card-model';

@Component({
  selector: 'app-dashboard-component',
  imports: [MiniCard],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent {
  card1 = input<MiniCardModel>(
      new MiniCardModel(
      "Earning this month",
      50000,
      "fa-solid text-xl fa-money-bill-trend-up"
    )
  )

  card2 = input<MiniCardModel>(
    new MiniCardModel(
      "Spent this month",
      50000,
      "fa-solid fa-money-bill-transfer"
    )
  )

  card3 = input<MiniCardModel>(
      new MiniCardModel(
      "Solde",
      500000,
      "fa-solid fa-money-bill-transfer"
    )
  )

  card4 = input<MiniCardModel>(
    new MiniCardModel(
    "Expense",
    100000,
    "fa-solid fa-money-bill-transfer"
  )
)
}
