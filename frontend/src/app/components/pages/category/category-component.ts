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
import { TranslationService } from '../../../core/services/translation-service';

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
  translationService = inject(TranslationService);
  asNext = false;

  totalPage!: number;
  private currentPage = 1;
  readonly itemsPerPageOptions = [2, 5, 10, 20, 50];

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
    public categorieStore: CategoryStore
  ) {

    effect(() => {
      const d = this.data$;

      if(d) {

        this.data$.subscribe(data => {
          if(data) {
            this.totalPage = Math.max(1, Math.ceil(data.total / data.element_per_page));
            this.currentPage = data.current_page;
          }
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
      budget_amount: [null],
    });
    this.categoryForm.get('type')?.valueChanges.subscribe(type => this.updateBudgetValidation(type));
    this.updateBudgetValidation(this.categoryForm.get('type')?.value);
  }

  private updateBudgetValidation(type: string) {
    const budgetControl = this.categoryForm.get('budget_amount');
    if (!budgetControl) return;

    if (type === 'outcome') {
      budgetControl.setValidators([Validators.required, Validators.min(100)]);
    } else {
      budgetControl.clearValidators();
      budgetControl.setValue(null, { emitEvent: false });
    }
    budgetControl.updateValueAndValidity({ emitEvent: false });
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
                type: data.categories.find(category => category.id === categoryId)?.type || "",
                budget_amount: data.categories.find(category => category.id === categoryId)?.budget_amount ?? null,
              });
            }
          });

        }

        this.categoryIdToUpdate = categoryId;
        this.formTitle = "Update category";
      } else {
        this.isUpdate = false;
        this.categoryIdToUpdate = -1;
        this.formTitle = "Add new category";
        this.categoryForm.reset({ name: '', type: 'income', color: '', budget_amount: null });
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
      this.sendingCategory = false;
      return;
    }

    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    const newCategory = new CategoryModel(
      this.categoryIdToUpdate,
      this.categoryForm.value.name,
      user_id,
      this.categoryForm.value.color,
      this.categoryForm.value.type,
      this.categoryForm.value.type === 'outcome' ? Number(this.categoryForm.value.budget_amount) : null,
    );

    if(!this.isUpdate) {

        this.categorieStore.onCreate(newCategory);
        
    } else {
      console.log("Updating category with ID:", this.categoryIdToUpdate);

      this.categorieStore.onUpdate(newCategory);
      this.categoryIdToUpdate = -1;

    }

    this.finishModal();
    
  }

  previousPage(currentPage: number) {

    this.categorieStore.resetCategory(currentPage - 1);
    
  }

  nextPage(currentPage: number) {

    this.categorieStore.resetCategory(currentPage + 1);
    
  }

  goToFirstPage() {
    this.goToPage(1);
  }

  goToLastPage() {
    this.goToPage(this.totalPage);
  }

  goToPage(page: string | number | HTMLInputElement) {
    const pageInput = page instanceof HTMLInputElement ? page : undefined;
    const requestedPage = pageInput ? pageInput.valueAsNumber : Number(page);

    if (
      !Number.isInteger(requestedPage)
      || requestedPage < 1
      || requestedPage > this.totalPage
    ) {
      if (pageInput) {
        pageInput.setCustomValidity(this.getPageValidationMessage());
        pageInput.reportValidity();
        pageInput.setCustomValidity('');
        pageInput.value = String(this.getCurrentPage());
      }
      return;
    }

    if (requestedPage !== this.getCurrentPage()) {
      this.categorieStore.resetCategory(requestedPage);
    }
  }

  changeItemsPerPage(itemsPerPage: string) {
    this.categorieStore.setCategoryItemsPerPage(Number(itemsPerPage));
  }

  private getCurrentPage(): number {
    return this.currentPage;
  }

  private getPageValidationMessage(): string {
    switch (this.translationService.language()) {
      case 'en': return `The page must be between 1 and ${this.totalPage}.`;
      case 'mg': return `Ny pejy dia tsy maintsy eo anelanelan’ny 1 sy ${this.totalPage}.`;
      default: return `La page doit être comprise entre 1 et ${this.totalPage}.`;
    }
  }

  getTransactionCountLabel(count: number): string {
    switch (this.translationService.language()) {
      case 'en':
        return `${count} transaction${count > 1 ? 's' : ''} this month`;
      case 'mg':
        return `${count} fifanakalozana amin’ity volana ity`;
      default:
        return `${count} transaction${count > 1 ? 's' : ''} ce mois-ci`;
    }
  }
}
