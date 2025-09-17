import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StatModel } from '../../models/stat-model';

@Component({
  selector: 'app-graph-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './graph-filter-component.html',
  styleUrls: ['./graph-filter-component.scss']
})
export class GraphFilterComponent {
  myData = input<StatModel>(new StatModel(0, 0, 0));
  
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
    this.originalMaxValue = this.maxValue;
    this.originalStepSize = this.stepSize;
  }

  updateChartScale(): void {
    console.log("eto")
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