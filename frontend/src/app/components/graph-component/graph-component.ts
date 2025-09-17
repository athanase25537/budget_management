import { Component, effect, input, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { StatModel } from '../../models/stat-model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Register required Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale);

@Component({
  selector: 'app-graph-component',
  standalone: true,
  imports: [BaseChartDirective, FormsModule, CommonModule],
  templateUrl: './graph-component.html',
  styleUrls: ['./graph-component.scss']
})
export class GraphComponent {

  myData = input<StatModel>(new StatModel(0, 0, 0));
  
  // Variables pour les filtres
  minValue: number = 0;
  maxValue: number = 700000;
  stepSize: number = 1000;
  private originalMaxValue: number = 700000;
  private originalStepSize: number = 1000;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor() {
    this.originalMaxValue = this.maxValue;
    this.originalStepSize = this.stepSize;

    effect(() => {
      const data = this.myData();
      this.chartData.datasets[0].data = [data.solde, 0, 0]; // Solde
      this.chartData.datasets[1].data = [0, data.expense, 0]; // Dépenses
      this.chartData.datasets[2].data = [0, 0, data.economy]; // Économies

      this.autoAdjustScale();
      this.chart?.update();
    });
  }

  autoAdjustScale(): void {
    const data = this.myData();
    const maxDataValue = Math.max(data.solde, data.expense, data.economy);
    
    if (maxDataValue > this.maxValue) {
      this.maxValue = Math.ceil(maxDataValue / 100000) * 100000;
      this.updateChartScale();
    }
  }

  updateChartScale(): void {
    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        y: {
          beginAtZero: true,
          min: this.minValue,
          max: this.maxValue,
          ticks: {
            stepSize: this.stepSize,
            callback: function(value) {
              return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            }
          }
        }
      }
    };
    
    this.chart?.update();
  }

  setScale(min: number, max: number, step: number): void {
    this.minValue = min;
    this.maxValue = max;
    this.stepSize = step;
    this.updateChartScale();
  }

  resetScale(): void {
    this.minValue = 0;
    this.maxValue = this.originalMaxValue;
    this.stepSize = this.originalStepSize;
    this.updateChartScale();
  }

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Solde', 'Dépenses', 'Économies'],
    datasets: [
      { 
        data: [0, 0, 0],
        label: 'Solde',
        backgroundColor: 'rgba(54, 162, 235, 0.7)', // Bleu
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 1, // Contrôle la largeur des barres
        // categoryPercentage: 0.8, // Contrôle l'espace entre les groupes de barres
      },
      { 
        data: [0, 0, 0],
        label: 'Dépenses',
        backgroundColor: 'rgba(255, 99, 132, 0.7)', // Rouge
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      { 
        data: [0, 0, 0],
        label: 'Économies',
        backgroundColor: 'rgba(255, 159, 64, 0.7)', // Orange au lieu de vert
        borderColor: 'rgba(255, 159, 64, 1)', // Bordure orange
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: this.minValue,
        max: this.maxValue,
        ticks: {
          stepSize: this.stepSize,
          callback: function(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' Ar';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ar`;
          }
        }
      }
    }
  };
}