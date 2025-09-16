import { Component, effect, input, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { StatModel } from '../../models/stat-model';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-pie-component',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-component.html',
  styleUrls: ['./pie-component.scss']
})
export class PieComponent {

  myData = input<StatModel>(new StatModel(0, 0, 0));

  // Référence vers le chart
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective<'doughnut'>;

  constructor() {
    effect(() => {
      const data = this.myData();

      this.chartData.datasets[0].data = [
        data.solde,
        data.expense,
        data.economy
      ];

      // 🔥 Forcer le refresh du graphique
      this.chart?.update();
    });
  }

  chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Solde', 'Expense', 'Economie'],
    datasets: [{
      data: [0, 0, 0],
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

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
}
