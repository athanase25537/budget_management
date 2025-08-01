import { Component, input, OnInit } from '@angular/core';
import { MiniCardModel } from '../../models/mini-card-model';
import { CurrencyPipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);

@Component({
  selector: 'app-mini-card',
  imports: [DecimalPipe, CurrencyPipe],
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
