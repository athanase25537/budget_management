import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';

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
  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { 
        data: [10, 20, 30], 
        label: 'Ventes',
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
        beginAtZero: true
      }
    }
  };
}