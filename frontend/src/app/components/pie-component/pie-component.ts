import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

// Enregistrement des éléments nécessaires pour le Pie Chart
Chart.register(PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-pie-component',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-component.html',
  styleUrls: ['./pie-component.scss']
})
export class PieComponent {
  // Configuration des données
  chartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Alimentation', 'Logement', 'Transport', 'Loisirs', 'Épargne'],
    datasets: [{
      data: [300, 500, 200, 150, 350],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Options du graphique
  chartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
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