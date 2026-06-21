import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { BudgetService } from '../../../../core/services/budget-service';
import { AuthService } from '../../../../core/services/auth-service';
import { CategoryModel } from '../../../../core/models/category-model';

@Component({
  selector: 'app-new-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-transaction.html',
  styleUrl: './new-transaction.scss'
})

export class NewTransaction implements OnInit {

  is_in!: boolean;
  isTypeNormal = input<boolean>(true);
  
  errorMessage = ''; // Message d’erreur affiché dans le template


  constructor(
    private budgetService: BudgetService, 
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  openModal(is_in: boolean) {
    this.is_in = is_in;
  }

}

