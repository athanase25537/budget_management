import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransactionStore } from '../../../core/data/transaction-store';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-graph-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './graph-filter-component.html',
  styleUrls: ['./graph-filter-component.scss']
})
export class GraphFilterComponent {
  solde$ = inject(TransactionStore).solde$;
  save$ = inject(TransactionStore).save$;
  amountOut$ = inject(TransactionStore).amountOut$;
  
  // Événements pour communiquer avec le composant parent
  scaleChange = output<{min: number, max: number, step: number}>();
  resetScaleEvent = output<void>();

  // Variables pour les filtres
  minValue: number = 0;
  maxValue: number = 700000;
  stepSize: number = 1000;
  private originalMaxValue: number = 700000;
  private originalStepSize: number = 1000;

  constructor() {
    combineLatest({
      solde: this.solde$,
      expense: this.amountOut$,
      save: this.save$
    }).subscribe({
      next: (result) => {
        let solde = (result.solde !== undefined) ? result.solde : 0;
        let expense = (result.expense !== undefined) ? result.expense : 0;
        let save = (result.save !== undefined) ? result.save : 0;
        let max = Math.max(solde, expense, save);
        this.originalMaxValue = max + 100;
        this.originalStepSize = Math.ceil(max / 10);
        this.maxValue = this.originalMaxValue;
        this.minValue = 0;

      },
      error: (err) => {
        console.log("Error", err)
      }
    });
    
  }

  updateChartScale(): void {
    this.scaleChange.emit({
      min: this.minValue,
      max: this.maxValue,
      step: this.stepSize
    });
  }

  resetScale(): void {
    this.minValue = 0;
    this.maxValue = this.originalMaxValue;
    this.stepSize = this.originalStepSize;
    this.resetScaleEvent.emit();
  }
}