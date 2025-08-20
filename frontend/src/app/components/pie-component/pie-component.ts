import { Component, effect, input, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { StatModel } from '../../models/stat-model';

// Enregistrement des éléments nécessaires pour le Doughnut Chart
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-pie-component',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-component.html',
  styleUrls: ['./pie-component.scss']
})

export class PieComponent {

  constructor() {
    // "effect" réagit automatiquement quand myData change
    effect(() => {
      const data = this.myData();
      console.log(data)
      this.chartData.datasets[0].data = [
        data.solde,
        data.expense,
        data.economy
      ];
    });
  }

  myData = input<StatModel>(new StatModel(50, 10, 20))
  
  // Configuration des données
  chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Solde', 'Expense', 'Economie'],
    datasets: [{
      data: [this.myData().solde, this.myData().economy, this.myData().expense],
      backgroundColor: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)'
      ],

      borderColor: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)'
      ],
      borderWidth: 1
    }]
  };

  // Options du graphique
  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '70%', // taille du trou (peut être ajustée, ex : '70%' pour plus grand trou)
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
}
