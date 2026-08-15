import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, OnInit, Output, TemplateRef, untracked, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { TransactionStore } from '../../../../core/data/transaction-store';
import { CategoryStore } from '../../../../core/data/category-store';
import { CategoryModel } from '../../../../core/models/category-model';
import { take } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation-service';

@Component({
  selector: 'app-transaction-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss'
})
export class TransactionForm implements OnInit {
  transactionForm!: FormGroup;
  overlayRef?: OverlayRef;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  errorMessage = '';
  sendTransaction = false;

  isIn = input.required<boolean>();
  isUpdate = input.required<boolean>();
  transactionToUpdate = input<TransactionModel>();

  defaultCategories$ = inject(CategoryStore).allCategories$;
  translationService = inject(TranslationService);
  errorTransaction: boolean = false;
  newTransaction!: TransactionModel;

  openForm = input.required<boolean>();
  @Output() closeForm = new EventEmitter<boolean>();
  lastTransactionUpdated = inject(TransactionStore).lastTransactionUpdated;

  constructor(
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private authService: AuthService,
    public transactionStore$: TransactionStore,
    private categorieStore$: CategoryStore
  ) {
    effect(() => {
      if(this.openForm()) {
        untracked(() => {
          this.openModal(this.isIn());
          this.transactionForm.setValue({
              amount: 100,
              reason: "",
              is_in: this.isIn(),
              category: "",
              id: -1,
              date: new Date().toISOString().split("T")[0]
            });
        });
      }

      if(this.isUpdate()) {
        untracked(() => {
          const transaction = this.transactionToUpdate();
          if(transaction != undefined) {
            this.transactionForm.setValue({
              amount: transaction.amount,
              reason: transaction.reason,
              is_in: transaction.is_in,
              category: transaction.category_id,
              id: transaction.id,
              date: transaction?.date.toString().split("T")[0]
            });

            this.lastTransactionUpdated.next(transaction);
          }
        })
      }
    })
  }

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(100)]],
      reason: [''],
      is_in: [true, Validators.required],
      category: ['', Validators.required],
      id: [-1, Validators.required],
      date: [new Date().toISOString().split("T")[0], Validators.required]
    });

    this.transactionForm.get('is_in')?.valueChanges.subscribe(() => {
      this.transactionForm.get('category')?.setValue('');
      this.errorTransaction = false;
    });

    this.categorieStore$.getAlltCategories();
  }

  openModal(is_in: boolean) {
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
    this.closeForm.emit(false);
  }

  onSubmit() {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      this.errorTransaction = true;
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      return;
    }    

    this.errorTransaction = false;
    this.errorMessage = '';
    this.defaultCategories$.pipe(take(1)).subscribe(categories => this.submitWithCategories(categories));
  }

  isIncomeTransaction(): boolean {
    return this.transactionForm?.get('is_in')?.value === true;
  }

  categoryMatchesTransactionType(category: CategoryModel): boolean {
    return this.isIncomeTransaction() ? category.type === 'income' : category.type === 'outcome';
  }

  getSelectedCategory(categories: CategoryModel[] | undefined): CategoryModel | undefined {
    return categories?.find(category => category.id === Number(this.transactionForm?.get('category')?.value));
  }

  private submitWithCategories(categories: CategoryModel[] | undefined) {
    const currentUser = this.authService.getCurrentUser();
    const selectedCategory = this.getSelectedCategory(categories);
    const amount = Number(this.transactionForm.value.amount);

    if (!currentUser || !selectedCategory || !this.categoryMatchesTransactionType(selectedCategory)) {
      this.showSubmitError('Select a valid category for this transaction type.');
      return;
    }

    if (!this.isIncomeTransaction()) {
      const availableAmount = this.getAvailableAmountForUpdate(selectedCategory);
      if (selectedCategory.budget_amount === null) {
        this.showSubmitError(`No monthly budget is configured for ${selectedCategory.name}.`);
        return;
      }
      if (amount > availableAmount) {
        this.showSubmitError(`Insufficient budget for ${selectedCategory.name}: ${availableAmount.toLocaleString()} MGA remaining.`);
        return;
      }
    }

    this.newTransaction = new TransactionModel(
      this.transactionForm.value.date.split('T')[0],
      amount,
      this.transactionForm.value.is_in,
      this.transactionForm.value.id,
      currentUser.id,
      this.transactionForm.value.reason || '',
      selectedCategory.name,
      selectedCategory.id,
      selectedCategory.color,
    );

    if (this.isUpdate() && this.AreSameTransaction(this.newTransaction, this.lastTransactionUpdated.value)) {
      this.closeModal();
      return;
    }

    this.sendTransaction = true;
    const callbacks = {
      success: () => {
        this.transactionStore$.updateMiniCardData(this.isUpdate(), this.newTransaction);
        this.sendTransaction = false;
        this.errorTransaction = false;
        this.closeModal();
      },
      error: (message: string) => this.showSubmitError(message),
    };

    if (this.isUpdate()) {
      this.transactionStore$.onUpdate(this.newTransaction, callbacks);
    } else {
      this.transactionStore$.onCreate(this.newTransaction, callbacks);
    }
  }

  getAvailableAmountForUpdate(category: CategoryModel): number {
    let availableAmount = category.remaining_amount ?? 0;
    const previousTransaction = this.lastTransactionUpdated.value;
    if (
      this.isUpdate()
      && !previousTransaction.is_in
      && previousTransaction.category_id === category.id
      && this.isSameMonth(previousTransaction.date, this.transactionForm.value.date)
    ) {
      availableAmount += previousTransaction.amount;
    }
    return availableAmount;
  }

  formatAvailableAmount(amount: number): string {
    const formattedAmount = amount.toLocaleString();
    switch (this.translationService.language()) {
      case 'en': return `${formattedAmount} MGA available`;
      case 'mg': return `${formattedAmount} MGA azo ampiasaina`;
      default: return `${formattedAmount} MGA disponibles`;
    }
  }

  get monthlyBudgetLabel(): string {
    switch (this.translationService.language()) {
      case 'en': return 'Monthly budget';
      case 'mg': return 'Tetibola isam-bolana';
      default: return 'Budget mensuel';
    }
  }

  private isSameMonth(firstDate: string, secondDate: string): boolean {
    return firstDate.slice(0, 7) === String(secondDate).slice(0, 7);
  }

  private showSubmitError(message: string) {
    this.sendTransaction = false;
    this.errorTransaction = true;
    this.errorMessage = message;
  }

  AreSameTransaction(lastTransaction: TransactionModel, newTransaction: TransactionModel) : boolean {
    return (lastTransaction.amount == newTransaction.amount &&
      lastTransaction.category_id == newTransaction.category_id &&
      lastTransaction.is_in == newTransaction.is_in &&
      lastTransaction.date.split("T")[0] == newTransaction.date.split("T")[0] &&
      lastTransaction.id == newTransaction.id &&
      lastTransaction.reason.toLowerCase() == newTransaction.reason.toLowerCase()
    )
  }

}
