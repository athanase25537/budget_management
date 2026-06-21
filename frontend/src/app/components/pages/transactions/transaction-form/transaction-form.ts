import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, effect, EventEmitter, input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../../../../core/services/budget-service';
import { AuthService } from '../../../../core/services/auth-service';
import { CategoryModel } from '../../../../core/models/category-model';
import { TransactionModel } from '../../../../core/models/transaction-model';

@Component({
  selector: 'app-transaction-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss'
})
export class TransactionForm implements OnInit, AfterViewInit {
  transactionForm!: FormGroup;
  overlayRef?: OverlayRef;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  errorMessage = '';
  sendTransaction = false;
  isIn = input.required<boolean>();
  isUpdate = input.required<boolean>();
  defaultCategories!: CategoryModel[];
  errorTransaction: boolean = false;

  @Output() dataOut = new EventEmitter<{ isSubmit: boolean, lastTransaction: TransactionModel }>();

  private viewInitialized = false;

  constructor(
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private budgetService: BudgetService,
    private authService: AuthService
  ) {  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.openModal(true)
  }

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(100)]],
      reason: ['', Validators.required],
      is_in: [true, Validators.required],
      category: ['', Validators.required]
    });

    // Get categories
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
    console.log("here we are...")
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

  openModalForUpdate() {
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

  onSubmit() {

  }
}
