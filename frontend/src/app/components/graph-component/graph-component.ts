import { Component, effect, input, OnInit, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { StatModel } from '../../models/stat-model';

// Register required Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale);

@Component({
  selector: 'app-graph-component',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './graph-component.html',  // Chemin vers le fichier HTML
  styleUrls: ['./graph-component.scss']   // Optionnel : si vous voulez un CSS séparé
})
export class GraphComponent {

  myData = input<StatModel>((new StatModel(0, 0, 0)))
  a = new StatModel(0, 0, 0)

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor() {
    // "effect" réagit automatiquement quand myData change
    effect(() => {
      const data = this.myData();
      this.chartData.datasets[0].data = [
        data.solde,
        data.expense,
        data.economy
      ];

      this.chart?.update();
    });
  }

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Solde', 'Expense', 'Economie'],
    datasets: [
      { 
        data: [this.myData().solde, this.myData().economy, this.myData().expense], 
        label: 'Money',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,         // valeur minimale
        max: 700000,      // valeur maximale
        ticks: {
          stepSize: 1000 // espacement entre les valeurs affichées
        }
      }
    }
  };
}