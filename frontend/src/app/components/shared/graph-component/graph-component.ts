import { Component, inject, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { TransactionStore } from '../../../core/data/transaction-store';

// Register required Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

@Component({
  selector: 'app-graph-component',
  standalone: true,
  imports: [BaseChartDirective, FormsModule, CommonModule],
  templateUrl: './graph-component.html',
  styleUrls: ['./graph-component.scss']
})
export class GraphComponent {

  solde$ = inject(TransactionStore).solde$;
  expense$ = inject(TransactionStore).amountOut$;
  save$ = inject(TransactionStore).save$;
  
  minValue: number = 0;
  maxValue: number = 600;
  stepSize: number = 1000;
  private originalMaxValue: number = 600;
  private originalStepSize: number = 1000;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor() {
    combineLatest({
      solde: this.solde$,
      expense: this.expense$,
      save: this.save$
    }).subscribe({
      next: (result) => {
        let solde = (result.solde !== undefined) ? result.solde : 0;
        let expense = (result.expense !== undefined) ? result.expense : 0;
        let save = (result.save !== undefined) ? result.save : 0;
        
        this.chartData.datasets[0].data = [solde, 0, 0];
        this.chartData.datasets[1].data = [0, expense, 0];
        this.chartData.datasets[2].data = [0, 0, save];

        let max = Math.max(solde, expense, save);
        this.originalMaxValue = max + 100;
        this.originalStepSize = Math.ceil(max / 10);
        this.maxValue = this.originalMaxValue;
        this.minValue = 0;

        let data = { solde, expense, save };
        this.autoAdjustScale(data);
        this.updateChartScale(); // Applique aussi les couleurs dynamiques
      },
      error: (err) => console.log("Error", err)
    });
  }

  // Permet de détecter si l'application est en mode sombre
  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  autoAdjustScale(data: { solde: number, expense: number, save: number}): void {
    const maxDataValue = Math.max(data.solde, data.expense, data.save);
    if (maxDataValue > this.maxValue) {
      this.updateChartScale();
    }
  }

  updateChartScale(): void {
    const isDark = this.isDarkMode();
    
    // Des couleurs plus franches et contrastées pour le mode sombre
    const axisColor = isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(113, 113, 122, 0.3)'; 
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(228, 228, 231, 0.6)';

    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        y: {
          beginAtZero: true,
          min: this.minValue,
          max: this.maxValue,
          ticks: {
            stepSize: this.stepSize,
            color: isDark ? '#cbd5e1' : '#4b5563', // Texte gris très clair en mode sombre
            padding: 8, // Donne de l'espace pour éviter que le texte colle à la ligne
            callback: function(value) {
              return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' Ar';
            }
          },
          grid: {
            color: gridColor,
            drawTicks: true,
            tickColor: axisColor,
            tickWidth: 1.5,
            drawOnChartArea: true // Assure le dessin de la grille sur la zone du graphique
          },
          border: {
            display: true,
            color: axisColor,
            width: 2 // Épaisseur augmentée à 2px pour qu'elle devienne bien visible
          }
        },
        x: {
          ticks: {
            color: isDark ? '#cbd5e1' : '#4b5563',
            padding: 8
          },
          grid: {
            display: false
          },
          border: {
            display: true,
            color: axisColor,
            width: 2 // Épaisseur de base horizontale pour fermer le cadre proprement
          }
        }
      },
      plugins: {
        ...this.chartOptions?.plugins,
        legend: {
          ...this.chartOptions?.plugins?.legend,
          labels: {
            ...this.chartOptions?.plugins?.legend?.labels,
            color: isDark ? '#f8fafc' : '#18181b',
            font: {
              weight: 'bold'
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
        backgroundColor: 'rgba(56, 189, 248, 0.85)', // Plus éclatant en dark/light
        borderColor: '#38bdf8',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      { 
        data: [0, 0, 0],
        label: 'Dépenses',
        backgroundColor: 'rgba(244, 63, 94, 0.85)', 
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      { 
        data: [0, 0, 0],
        label: 'Économies',
        backgroundColor: 'rgba(251, 146, 60, 0.85)', 
        borderColor: '#fb923c', 
        borderWidth: 1.5,
        borderRadius: 8,
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
      y: { beginAtZero: true },
      x: { grid: { display: false } }
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900 pour un tooltip premium moderne
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ar`;
          }
        }
      }
    }
  };
}