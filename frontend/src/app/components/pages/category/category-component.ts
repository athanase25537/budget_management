import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MiniCard } from '../../shared/mini-card/mini-card';
import { CategoryModel } from '../../../core/models/category-model';
import { BudgetService } from '../../../core/services/budget-service';
import { AuthService } from '../../../core/services/auth-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CategoryStore } from '../../../core/data/category-store';
import { TableCategoryModel } from '../../../core/models/table-category-model';

@Component({
  selector: 'app-category-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-component.html',
  styleUrl: './category-component.scss'
})
export class CategoryComponent implements OnInit {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  overlayRef?: OverlayRef;
  errorMessage = '';
  errorCategory = false;

  data!: TableCategoryModel;
  totalPage!: number;

  categories: CategoryModel[] = [];
  filteredCategories: CategoryModel[] = [];
  categoryForm !: FormGroup;
  sendingCategory = false;
  page: number = 1;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;
  totalCategory!: number;
  elementPerPage!: number;

  categoryIdToUpdate: number = -1;

  isUpdate: boolean = false; 
  formTitle: string = "Add new category";

  constructor(
    private budgetService: BudgetService, 
    private authService: AuthService,
    private fb: FormBuilder,
    private vcr: ViewContainerRef,
    private overlay: Overlay,
    private categorieStore: CategoryStore
  ) {

    this.categorieStore.categories$.subscribe((data) => {
      if(data) this.data = data;
      console.log("data", data)
    });

    this.categorieStore.totalPage$.subscribe((totalPage) => {
      this.totalPage = totalPage;
    });

  }

  ngOnInit(): void {
    this.categorieStore.resetCategory();
    this.categoryForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(4)]],
      color: ['', Validators.required],
    });
  }

    openModal(isUpdate: boolean, categoryId: number = -1) {
      if(isUpdate) {

        this.isUpdate = true;
        if(categoryId !== -1) {
          this.categoryForm.setValue({
            name: this.data.categories.find(category => category.id === categoryId)?.name || "",
            color: this.data.categories.find(category => category.id === categoryId)?.color || ""
          });
        }

        this.categoryIdToUpdate = categoryId;
        this.formTitle = "Update category";
      } else {
        this.isUpdate = false;
      }
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

  onDelete(categoryId: number) {
    
    this.categorieStore.onDelete(categoryId);

  }

  resetCategory() {

    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    this.budgetService.getCategoriesByUserId(user_id, this.page).subscribe({
      next: (data: any) => {
        this.categories = data.categories;
        this.filteredCategories = data.categories;
        this.hasNextPage = data.has_next_page;
        this.hasPreviousPage = data.has_previous_page;
        this.totalCategory = data.total;
        this.totalPage = Math.ceil(this.totalCategory / data.element_per_page);
        this.elementPerPage = data.element_per_page;
      }
    });
    
  }

  finishModal() {

    this.closeModal();
    this.sendingCategory = false;

  }

  onUpdate() {

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
      this.categoryIdToUpdate,
      this.categoryForm.value.name,
      user_id,
      this.categoryForm.value.color
    );

    console.log("isupdate", this.isUpdate)
    if(!this.isUpdate) {

        this.categorieStore.onCreate(newCategory);
        
    } else {
      console.log("Updating category with ID:", this.categoryIdToUpdate);

      this.categorieStore.onUpdate(newCategory);
      this.categoryIdToUpdate = -1;

    }

    this.finishModal();
    
  }

  previousPage() {
    if(!this.hasPreviousPage) return
    
    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    this.budgetService.getCategoriesByUserId(user_id, this.page-1).subscribe({
      next: (data: any) => {
        this.categories = data.categories;
        this.filteredCategories = data.categories;
        this.hasNextPage = data.has_next_page;
        this.hasPreviousPage = data.has_previous_page;
        this.page--
      }
    });
  }

  nextPage() {

    if(!this.hasNextPage) return

    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    this.budgetService.getCategoriesByUserId(user_id, this.page+1).subscribe({
      next: (data: any) => {
        if(data.length !== 0) {
          this.categories = data.categories;
          this.filteredCategories = data.categories;
          this.hasNextPage = data.has_next_page;
          this.hasPreviousPage = data.has_previous_page;
          this.page++
        }
        return
      },
      error: (err) => {
        console.log("Error", err)
        return
      }
    });
  }
}
