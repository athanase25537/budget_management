import { Component, input, EventEmitter, Output } from '@angular/core';
import { TransactionModel } from '../../../core/models/transaction-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionStore } from '../../../core/data/transaction-store';

type TimePeriod = 'week' | 'month' | 'year' | null;

@Component({
  selector: 'app-status-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './status-filter.html',
  styleUrl: './status-filter.scss'
})
export class StatusFilter {

  // Filtre de statut (In / Out / All)
  activeFilter = 'all';

  // Filtres de date
  timePeriod: TimePeriod = null;
  selectedDate: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;

  isFirstTransaction = input.required<boolean>();

  @Output() filteredTransactions = new EventEmitter<TransactionModel[]>();

  constructor(
    private transactionStore$: TransactionStore
  ) {}

  // 1. Filtrage par Statut (In / Out / All)
  filterTransactions(type: string) {
    this.activeFilter = type;
    this.applyFilters();
  }

  // 2. Filtrage par Période Prédéfinie (Semaine, Mois, Année)
  setTimePeriod(period: TimePeriod) {
    this.timePeriod = period;
    // Réinitialise les sélections manuelles
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  // 3. Sélection d'une Date Unique / Calendrier
  onDateChange() {
    this.timePeriod = null;
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  // 4. Sélection d'une Plage de Dates (Start - End)
  onDateRangeChange() {
    this.timePeriod = null;
    this.selectedDate = null;
    if (this.startDate && this.endDate) {
      this.applyFilters();
    }
  }

  // 5. Réinitialisation des filtres temporels
  resetDateFilters() {
    this.timePeriod = null;
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  // Méthode centrale de déclenchement du filtre
  private applyFilters() {
    const filterPayload = {
      type: this.activeFilter,
      period: this.timePeriod,
      date: this.selectedDate,
      range: { start: this.startDate, end: this.endDate }
    };

    if (this.isFirstTransaction()) {
      // this.transactionStore$.onFilterFirstTransaction(filterPayload);
    } else {
      // this.transact+ionStore$.onFilterTransaction(filterPayload);
    }
  }
}