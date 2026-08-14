import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionStore } from '../../../core/data/transaction-store';
import { TransactionFilters } from '../../../core/services/budget-service';

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
  timePeriod: TimePeriod = 'month';
  selectedDate: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  isDateRangeInvalid = false;

  isFirstTransaction = input.required<boolean>();
  needAdvancedFilter = input.required<boolean>();

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
    this.isDateRangeInvalid = false;
    this.applyFilters();
  }

  // 3. Sélection d'une Date Unique / Calendrier
  onDateChange() {
    this.timePeriod = this.selectedDate ? null : 'month';
    this.startDate = null;
    this.endDate = null;
    this.isDateRangeInvalid = false;
    this.applyFilters();
  }

  // 4. Sélection d'une Plage de Dates (Start - End)
  onDateRangeChange() {
    this.timePeriod = (this.startDate || this.endDate) ? null : 'month';
    this.selectedDate = null;
    this.isDateRangeInvalid = !!this.startDate && !!this.endDate && this.startDate > this.endDate;

    if (this.isDateRangeInvalid) {
      return;
    }

    this.applyFilters();
  }

  // 5. Réinitialisation des filtres temporels
  resetDateFilters() {
    this.timePeriod = 'month';
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.isDateRangeInvalid = false;
    this.applyFilters();
  }

  // Méthode centrale de déclenchement du filtre
  private applyFilters() {
    this.transactionStore$.applyTransactionFilters(
      this.buildFilters(),
      this.isFirstTransaction()
    );
  }

  private buildFilters(): TransactionFilters {
    const filters: TransactionFilters = {};

    if (this.activeFilter === 'is_in') {
      filters.is_in = true;
    } else if (this.activeFilter === 'is_out') {
      filters.is_out = true;
    }

    if (this.selectedDate) {
      return {
        ...filters,
        start_date: `${this.selectedDate}T00:00:00`,
        end_date: `${this.selectedDate}T23:59:59.999`
      };
    }

    if (this.startDate || this.endDate) {
      return {
        ...filters,
        ...(this.startDate && { start_date: `${this.startDate}T00:00:00` }),
        ...(this.endDate && { end_date: `${this.endDate}T23:59:59.999` })
      };
    }

    const now = new Date();
    if (this.timePeriod === 'week') {
      const startOfWeek = new Date(now);
      const daysSinceMonday = (now.getDay() + 6) % 7;
      startOfWeek.setDate(now.getDate() - daysSinceMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      filters.start_date = this.formatDateTime(startOfWeek);
      filters.end_date = this.formatDateTime(now);
    } else if (this.timePeriod === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filters.start_date = this.formatDateTime(startOfMonth);
      filters.end_date = this.formatDateTime(now);
    } else if (this.timePeriod === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filters.start_date = this.formatDateTime(startOfYear);
      filters.end_date = this.formatDateTime(now);
    }

    return filters;
  }

  private formatDateTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
