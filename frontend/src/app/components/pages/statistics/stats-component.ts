import { Component, OnInit, ViewChild } from '@angular/core';
import { GraphComponent } from "../../shared/graph-component/graph-component";
import { GraphFilterComponent } from '../../shared/graph-filter/graph-filter-component';
import { TransactionItemComponent } from "../transactions/transaction-item-component/transaction-item-component";
import { BudgetService } from '../../../core/services/budget-service';
import { TransactionModel } from '../../../core/models/transaction-model';
import { StatusFilter } from "../../shared/status-filter/status-filter";
import { UserModel } from '../../../core/models/user-model';
import { StatModel } from '../../../core/models/stat-model';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-stats-component',
  imports: [GraphComponent, GraphFilterComponent],
  templateUrl: './stats-component.html',
  styleUrl: './stats-component.scss'
})
export class StatsComponent {

  @ViewChild(GraphComponent) graphComponent!: GraphComponent;

  constructor(private budgetService: BudgetService, private authService: AuthService) { }

  // Gestion des événements des filtres
  onScaleChange(scale: {min: number, max: number, step: number}): void {
    if (this.graphComponent) {
      this.graphComponent.setScale(scale.min, scale.max, scale.step);
    }
  }

  onResetScale(): void {
    if (this.graphComponent) {
      this.graphComponent.resetScale();
    }
  }

}