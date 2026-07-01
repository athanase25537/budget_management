import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule, JsonPipe } from '@angular/common';
import { AfterViewInit, Component, effect, EventEmitter, inject, input, OnInit, Output, TemplateRef, untracked, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../../../../core/services/budget-service';
import { AuthService } from '../../../../core/services/auth-service';
import { CategoryModel } from '../../../../core/models/category-model';
import { TransactionModel } from '../../../../core/models/transaction-model';
import { TransactionStore } from '../../../../core/data/transaction-store';

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

  defaultCategories$ = inject(TransactionStore).defaultCategoriesSubject;
  errorTransaction: boolean = false;
  newTransaction!: TransactionModel;

  openForm = input.required<boolean>();
  @Output() closeForm = new EventEmitter<boolean>();
  lastTransactionUpdated = inject(TransactionStore).lastTransactionUpdated;

  @Output() dataOut = new EventEmitter<{ isSubmit: boolean, isUpdate: boolean, lastTransaction: TransactionModel }>();

  constructor(
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private authService: AuthService,
    public transactionStore$: TransactionStore
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
      reason: ['', Validators.required],
      is_in: [true, Validators.required],
      category: ['', Validators.required],
      id: [-1, Validators.required],
      date: [new Date().toISOString().split("T")[0], Validators.required]
    });
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

    this.sendTransaction = true;
    this.errorTransaction = false;
    this.errorMessage = '';

    const { amount, reason } = this.transactionForm.value;
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      const user_id = currentUser.id;
      let category = this.defaultCategories$.value.find((cat) => cat.id == this.transactionForm.value.category)

      this.newTransaction = new TransactionModel(
        this.transactionForm.value.date.split('T')[0],
        amount,
        this.transactionForm.value.is_in,
        this.transactionForm.value.id,
        user_id,
        reason,
        (category) ? category.name : undefined, // category name
        this.transactionForm.value.category, // category id
        (category) ? category.color : undefined
      );

      if(!this.isUpdate()) {
        this.transactionStore$.onCreate(this.newTransaction);

        this.dataOut.emit({ isSubmit: true, isUpdate: false, lastTransaction: this.newTransaction});
        this.sendTransaction = false;
        this.closeModal();
        this.errorTransaction = false;
      } else {
        // update transactions
        if(!this.AreSameTransaction(this.newTransaction, this.lastTransactionUpdated.value)) {
          this.transactionStore$.onUpdate(this.newTransaction);
        }

        this.dataOut.emit({ isSubmit: true, isUpdate: true, lastTransaction: this.newTransaction});
        this.sendTransaction = false;
        this.closeModal();
        this.errorTransaction = false;
      }

      this.transactionStore$.updateMiniCardData(this.isUpdate(), this.newTransaction);
    } else {
      this.errorTransaction = true;
      this.errorMessage = 'No user is logged in.';
      this.sendTransaction = false;
    }
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
