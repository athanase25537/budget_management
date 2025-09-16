import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionModel } from '../../models/transaction-model';
import { BudgetService } from '../../services/budget-service';
import { AuthService } from '../../services/auth-service';

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
  
  @Output() isSubmit = new EventEmitter<boolean>();

  constructor(
    private budgetService: BudgetService, 
    private fb: FormBuilder,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      amount: [0, Validators.required],
      reason: ['', Validators.required]
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
    const { amount, reason } = this.transactionForm.value;

    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();
  
    if (currentUser) {
      let user_id = currentUser.id;

      this.newTransaction = new TransactionModel(
        new Date().toISOString(),
        amount,
        this.is_in,
        -1, // transaction id: auto generate on backend
        user_id,
        reason
      );

      this.budgetService.addTransaction(this.newTransaction).subscribe({
        next: (data) => {
          this.isSubmit.emit(true);
          this.closeModal();
        },
        error: (err) => {
          console.log(err);
        }
      });
    }
  }
}
