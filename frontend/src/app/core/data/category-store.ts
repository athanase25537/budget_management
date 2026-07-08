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

    private categoriesSubject = new BehaviorSubject<TableCategoryModel | undefined>(undefined);
    private totalPageSubject = new BehaviorSubject<number>(0);

    categories$: Observable<TableCategoryModel | undefined> = this.categoriesSubject.asObservable();
    totalPage$: Observable<number> = this.totalPageSubject.asObservable();
    
    private page: number = 1;

    constructor(
        private authService: AuthService,
        private budgetService: BudgetService,
        private toastService: ToastService
    ) { }

    resetCategory() {

        if(!this.cacheCategories.has(this.page)) {
            const user_id: number = this.authService.getCurrentUser()?.id || 1;
            this.budgetService.getCategoriesByUserId(user_id, this.page).subscribe({
                next: (data: any) => {

                    let table_data = new TableCategoryModel(
                        data.categories,
                        data.has_next_page,
                        data.has_previous_page,
                        data.current_page,
                        data.element_per_page,
                        data.total
                    );

                    this.cacheCategories.set(this.page, table_data)
                    const cacheData = this.cacheCategories.get(this.page);
                    this.categoriesSubject.next(cacheData);
                    
                    let totalPage = Math.ceil(data.total / data.element_per_page);
                    this.totalPageSubject.next(totalPage);

                }
            });
        }
        
    }

    onCreate(newCategory: CategoryModel) {

        console.log("atooo")
        this.budgetService.createCategory(newCategory).subscribe({
            next: (response) => {
                if (response === 'success') {
                    this.resetCache();
                    this.resetCategory();

                    console.log("tena efa ok")

                    this.toastService.show({ type: "create", message: "Category successfully created." })

                } else {

                    this.toastService.show({ type: "error", message: "Failed to create category. Please try again."})
                }
                
            },
            error: (err) => {
                console.error('Error creating category:', err);

                this.toastService.show({ type: "error", message: "An error occurred while creating the category. Please try again."});
            }
            });

    }

    onUpdate(categoryToUpdate: CategoryModel) {

        this.budgetService.updateCategory(categoryToUpdate).subscribe({
            next: (response) => {

                if (response === 'success') {
                    this.resetCache();
                    this.resetCategory();

                    this.toastService.show({ type: "update", message: "Category successfully updated." })
                }

            },
            error: (err) => {
                console.error('Error updating category:', err);

                this.toastService.show({ type: "error", message: "An error occurred while updating the category. Please try again."});
            }
        })
        this.resetCache();
        this.resetCategory();

    }

    onDelete(categoryId: number) {

        this.budgetService.deleteCategory(categoryId).subscribe({
            next: (response) => {
                if(response === 'success') {

                    // reset cache
                    this.resetCache();
                    this.resetCategory();

                    // send message to toast
                    this.toastService.show({ type: "error", message: "Category successfully deleted." })

                } else {
                    this.toastService.show({ type: "error", message: "Failed to delete category. Please try again." })
                }
            },
            error: (err) => {
                console.error('Error deleting category:', err);
                this.toastService.show({ type: "error", message: "An error occurred while deleting the category. Please try again." })
            }
            });

    }

    private resetCache() {
        this.cacheCategories.clear();
    }
}