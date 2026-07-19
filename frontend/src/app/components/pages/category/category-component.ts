import { Component, effect, inject, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
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

  data$ = inject(CategoryStore).categories$

  totalPage!: number;

  categories: CategoryModel[] = [];
  filteredCategories: CategoryModel[] = [];
  categoryForm !: FormGroup;
  sendingCategory = false;

  categoryIdToUpdate: number = -1;

  isUpdate: boolean = false; 
  formTitle: string = "Add new category";

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private vcr: ViewContainerRef,
    private overlay: Overlay,
    private categorieStore: CategoryStore
  ) {

    effect(() => {
      const d = this.data$;

      if(d) {

        this.data$.subscribe(data => {
          if(data) this.totalPage = Math.ceil(data.total / data.element_per_page);
        })
      }
    })
  }

  ngOnInit(): void {
    this.categorieStore.resetCategory(1);
    this.categoryForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(4)]],
      type: ["income", [Validators.required]],
      color: ['', Validators.required],
    });
  }

    openModal(isUpdate: boolean, categoryId: number = -1) {
      if(isUpdate) {
        this.isUpdate = true;
        if(categoryId !== -1) {
          this.data$.subscribe(data => {
            if(data) {
              this.categoryForm.setValue({
                name: data.categories.find(category => category.id === categoryId)?.name || "",
                color: data.categories.find(category => category.id === categoryId)?.color || "",
                type: data.categories.find(category => category.id === categoryId)?.type || ""
              });
            }
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
      this.categoryForm.value.color,
      this.categoryForm.value.type
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

    this.data$.subscribe(data => {
      if(data?.has_previous_page) {
        this.categorieStore.resetCategory(data.current_page - 1);
      }
    })
    
  }

  nextPage() {

    this.data$.subscribe(data => {
      if(data?.has_next_page) {
        this.categorieStore.resetCategory(data.current_page + 1);
      }
    })
    
  }
}
