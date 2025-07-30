import { Component, input } from '@angular/core';
import { MiniCardModel } from '../../models/mini-card-model';

@Component({
  selector: 'app-card-med-component',
  imports: [],
  templateUrl: './card-med-component.html',
  styleUrl: './card-med-component.scss'
})
export class CardMedComponent {
  myMedCard = input<MiniCardModel>(
    new MiniCardModel(
    "Spent this month",
    50000,
    "fa-solid text-xl fa-money-bill-trend-up"
  )
);
}
