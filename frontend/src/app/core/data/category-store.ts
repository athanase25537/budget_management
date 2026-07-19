import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { BudgetService } from "../services/budget-service";
import { ToastService } from "../services/toast-service";
import { CategoryModel } from "../models/category-model";
import { AuthService } from "../services/auth-service";
import { TableCategoryModel } from "../models/table-category-model";

@Injectable({
    providedIn: 'root'
})

export class CategoryStore {

    private cacheCategories = new Map<number, TableCategoryModel>();

    private allCategoriesSubject = new BehaviorSubject<CategoryModel[] | undefined>(undefined);
    private categoriesSubject = new BehaviorSubject<TableCategoryModel | undefined>(undefined);

    allCategories$: Observable<CategoryModel[] | undefined> = this.allCategoriesSubject.asObservable();
    categories$: Observable<TableCategoryModel | undefined> = this.categoriesSubject.asObservable();
    
    private page: number = 1;

    private userId: number;

    constructor(
        private authService: AuthService,
        private budgetService: BudgetService,
        private toastService: ToastService,
    ) {
        this.userId = this.authService.getCurrentUser()?.id || 1;
    }

    resetCategory(page: number) {

        if(!this.cacheCategories.has(page)) {
            this.budgetService.getCategoriesByUserId(this.userId, page).subscribe({
                next: (data: any) => {

                    if(page > 1 && data.categories.length == 0) {
                        this.resetCategory(page-1);
                        return;
                    }

                    let table_data = new TableCategoryModel(
                        data.categories,
                        data.has_next_page,
                        data.has_previous_page,
                        data.current_page,
                        data.element_per_page,
                        data.total
                    );

                    this.cacheCategories.set(page, table_data)
                    const cacheData = this.cacheCategories.get(page);
                    this.categoriesSubject.next(cacheData);

                    this.page = data.current_page;

                }
            });

        } else {
            const cacheData = this.cacheCategories.get(page);
            if(cacheData) {
                this.categoriesSubject.next(cacheData);
                this.page = cacheData.current_page;
            }
        }
        
    }

    onCreate(newCategory: CategoryModel) {

        this.budgetService.createCategory(newCategory).subscribe({
            next: (response) => {
                if (response === 'success') {
                    this.resetCache();
                    this.resetCategory(this.page);                    
                    this.resetAllCategories();

                } else {
                    this.toastService.show({ type: "error", message: "Failed to create category. Please try again."})
                }
                
            },
            error: (err) => {
                console.error('Error creating category:', err);

                this.toastService.show({ type: "error", message: "An error occurred while creating the category. Please try again."});
            },
            complete: () => {
                this.toastService.show({ type: "create", message: "Category successfully created." });
            }
        });

    }

    onUpdate(categoryToUpdate: CategoryModel) {

        this.budgetService.updateCategory(categoryToUpdate).subscribe({
            next: (response) => {

                if (response === 'success') {
                    this.resetCache();
                    this.resetCategory(this.page);
                    this.resetAllCategories();
                }
            },
            error: (err) => {
                console.error('Error updating category:', err);

                this.toastService.show({ type: "error", message: "An error occurred while updating the category. Please try again."});
            },
            complete: () => {
                this.toastService.show({ type: "update", message: "Category successfully updated." });
            }
        })
        this.resetCache();
        this.resetCategory(this.page);

    }

    onDelete(categoryId: number) {

        this.budgetService.deleteCategory(categoryId).subscribe({
            next: (response) => {
                if(response === 'success') {

                    // reset cache
                    this.resetCache();
                    this.resetCategory(this.page);

                    this.resetAllCategories();

                }
            },
            error: (err) => {
                console.error('Error deleting category:', err);
                this.toastService.show({ type: "error", message: "An error occurred while deleting the category. Please try again." })
            },
            complete: () => {
                // send message to toast
                this.toastService.show({ type: "error", message: "Category successfully deleted." })
            }
        });

    }

    private resetCache() {
        this.cacheCategories.clear();
    }

    getAlltCategories() {

        if(this.allCategoriesSubject.value == undefined) {
            this.resetAllCategories();
        }
        
    }

    resetAllCategories() {

        this.budgetService.getAllCategoriesByUserId(this.userId).subscribe({
            next: (categories) => {
                this.allCategoriesSubject.next(categories);
            },
            error: (err) => {
                console.error('Error fetching default categories:', err);
            }
        });

    }
}