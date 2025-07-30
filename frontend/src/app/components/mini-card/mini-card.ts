import { Component, input, OnInit } from '@angular/core';
import { MiniCardModel } from '../../models/mini-card-model';

@Component({
  selector: 'app-mini-card',
  imports: [],
  templateUrl: './mini-card.html',
  styleUrl: './mini-card.scss'
})
export class MiniCard {

  myMiniCard = input<MiniCardModel>(
      new MiniCardModel(
      "Spent this month",
      50000,
      "fa-solid text-xl fa-money-bill-trend-up"
    )
  );

}
