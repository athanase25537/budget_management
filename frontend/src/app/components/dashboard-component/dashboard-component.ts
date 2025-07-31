import { Component, input } from '@angular/core';
import { MiniCard } from "../mini-card/mini-card";
import { MiniCardModel } from '../../models/mini-card-model';
import { CardMedComponent } from "../card-med-component/card-med-component";
import { GraphComponent } from "../graph-component/graph-component";

@Component({
  selector: 'app-dashboard-component',
  imports: [MiniCard, CardMedComponent, GraphComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent {
  card1 = input<MiniCardModel>(
      new MiniCardModel(
      "Earning this month",
      100000,
      "fa-solid text-xl fa-money-bill-trend-up text-green-500"
    )
  )

  card2 = input<MiniCardModel>(
    new MiniCardModel(
      "Spent this month",
      20000,
      "fa-solid fa-money-bill-transfer text-red-500"
    )
  )

  card3 = input<MiniCardModel>(
      new MiniCardModel(
      "Solde",
      500000,
      "fa-solid fa-money-bills text-blue-500"
    )
  )

  card4 = input<MiniCardModel>(
    new MiniCardModel(
    "Expense",
    100000,
    "fa-solid fa-money-bill-wheat text-orange-500"
  )
)
}
