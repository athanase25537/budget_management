import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MiniCard } from '../mini-card/mini-card';
import { CategoryModel } from '../../models/category-model';
import { BudgetService } from '../../services/budget-service';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-category-component',
  imports: [MiniCard, CommonModule, ReactiveFormsModule],
  templateUrl: './category-component.html',
  styleUrl: './category-component.scss'
})
export class CategoryComponent implements OnInit {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  overlayRef?: OverlayRef;
  errorMessage = '';
  errorCategory = false;
  categories: CategoryModel[] = [];
  filteredCategories: CategoryModel[] = [];
  categoryForm !: FormGroup;
  sendingCategory = false;

  constructor(
    private budgetService: BudgetService, 
    private authService: AuthService,
    private fb: FormBuilder,
    private vcr: ViewContainerRef,
    private overlay: Overlay
  ) { }

  ngOnInit(): void {
    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    console.log(user_id)
    this.budgetService.getCategoriesByUserId(user_id, 1).subscribe({
      next: (data: any) => {
        this.categories = data;
        this.filteredCategories = data;
        console.log('Categories fetched successfully:', this.categories);
      }
    });

    this.categoryForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(4)]],
      color: ['', Validators.required],
    });
  }

    openModal() {
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
    this.sendingCategory = true;
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.errorCategory = true;
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      return;
    }

    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    const newCategory = new CategoryModel(
      -1,
      this.categoryForm.value.name,
      user_id,
      this.categoryForm.value.color
    );
    this.budgetService.createCategory(newCategory).subscribe({
      next: (response) => {
        if (response === 'success') {
          this.filteredCategories.push(newCategory);
          this.closeModal();
        } else {
          this.errorCategory = true;
          this.errorMessage = 'Failed to create category. Please try again.';
        }
        this.sendingCategory = false;
      },
      error: (err) => {
        console.error('Error creating category:', err);
        this.errorCategory = true;
        this.errorMessage = 'An error occurred while creating the category. Please try again.';
        this.sendingCategory = false;
      }
    });
  }

}
