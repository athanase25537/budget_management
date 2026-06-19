import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
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
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  overlayRef?: OverlayRef;
  
  transactionForm!: FormGroup;
  is_in!: boolean;
  newTransaction!: TransactionModel;
  isTypeNormal = input<boolean>(true);
  defaultCategories: CategoryModel[] = [];
  
  sendTransaction = false;
  errorTransaction = false;
  errorMessage = ''; // Message d’erreur affiché dans le template

  @Output() dataOut = new EventEmitter<{ isSubmit: boolean, lastTransaction: TransactionModel }>();

  constructor(
    private budgetService: BudgetService, 
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(100)]],
      reason: ['', Validators.required],
      category: ['', Validators.required]
    });
    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    this.budgetService.getAllCategoriesByUserId(user_id).subscribe({
      next: (categories) => {
        this.defaultCategories = categories;
      },
      error: (err) => {
        console.error('Error fetching default categories:', err);
      }
    });
  }

  openModal(is_in: boolean) {
    this.is_in = is_in;
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      panelClass: 'centered-modal',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically()
    });

    const portal = new TemplatePortal(this.modalTemplate, this.vcr);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.closeModal());
  }

  closeModal() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  submitForm() {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      this.errorTransaction = true;
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      return;
    }    

    this.sendTransaction = true;
    this.errorTransaction = false;
    this.errorMessage = '';

    const { amount, reason } = this.transactionForm.value;
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      const user_id = currentUser.id;
      let category = this.defaultCategories.find((cat) => cat.id == this.transactionForm.value.category)

      this.newTransaction = new TransactionModel(
        new Date().toISOString(),
        amount,
        this.is_in,
        -1,
        user_id,
        reason,
        (category) ? category.name : undefined, // category name
        this.transactionForm.value.category, // category id
        (category) ? category.color : undefined
      );

      this.budgetService.addTransaction(this.newTransaction).subscribe({
        next: () => {
          this.dataOut.emit({ isSubmit: true, lastTransaction: this.newTransaction});

          this.sendTransaction = false;
          this.closeModal();
          this.errorTransaction = false;
        },
        error: (err) => {
          console.error(err);
          this.sendTransaction = false;
          this.errorTransaction = true;

          // Gestion fine des erreurs API
          if (err.status === 0) {
            this.errorMessage = 'Cannot reach the server. Please try again later.';
          } else if (err.status === 400) {
            this.errorMessage = 'Invalid request. Please check your data.';
          } else if (err.status === 401) {
            this.errorMessage = 'You are not authorized. Please log in again.';
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
        }
      });
    } else {
      this.errorTransaction = true;
      this.errorMessage = 'No user is logged in.';
      this.sendTransaction = false;
    }
  }
}

