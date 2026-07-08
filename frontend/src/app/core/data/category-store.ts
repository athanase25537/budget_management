import { Injectable } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { TransactionModel } from "../models/transaction-model";
import { BudgetService } from "../services/budget-service";
import { ToastService } from "../services/toast-service";
import { SettingsService } from "../services/settings-service";
import { SettingsModel } from "../models/settings-model";
import { CategoryModel } from "../models/category-model";
import { TableTransactionModel } from "../models/table-transaction-model";
import { AuthService } from "../services/auth-service";
import { TableCategoryModel } from "../models/table-category-model";

@Injectable({
    providedIn: 'root'
})

export class CategoryStore {

    private cacheCategories = new Map<number, TableCategoryModel>();

    private categoriesSubject = new BehaviorSubject<TableCategoryModel | undefined>(undefined);
    private hasNextPageSubject = new BehaviorSubject<number>(0);
    private hasPreviousPageSubject = new BehaviorSubject<number>(0);
    private totalCategorySubject = new BehaviorSubject<number>(0);
    private totalPageSubject = new BehaviorSubject<number>(0);
    private elementPerPageSubject = new BehaviorSubject<number>(0);

    categories$: Observable<TableCategoryModel | undefined> = this.categoriesSubject.asObservable();
    hasNextPage: Observable<number> = this.hasNextPageSubject.asObservable();
    hasPreviousPage: Observable<number> = this.hasPreviousPageSubject.asObservable();
    totalCategory: Observable<number> = this.totalCategorySubject.asObservable();
    totalPage: Observable<number> = this.totalPageSubject.asObservable();
    elementPerPage: Observable<number> = this.elementPerPageSubject.asObservable();
    private page: number = 1;

    constructor(
        private authService: AuthService,
        private budgetService: BudgetService
    ) { }

    private resetCategory() {

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
                    
                    let totalPage = Math.ceil(data.total / data.element_per_page);
                    this.totalPageSubject.next(totalPage);

                }
            });
        }
        
    }

    onCreate() {

        
        this.resetCache();
        this.resetCategory();
    }

    onUpdate() {
        this.resetCache();
        this.resetCategory();
    }

    onDelete() {
        this.resetCache();
        this.resetCategory();
    }

    private resetCache() {
        this.cacheCategories.clear();
    }
}