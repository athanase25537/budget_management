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

@Injectable({
    providedIn: 'root'
})

export class CategoryStore {

    private cacheCategories = new Map<number, CategoryModel[]>();

    private categoriesSubject = new BehaviorSubject<CategoryModel[] | undefined>(undefined);
    private hasNextPageSubject = new BehaviorSubject<number>(0);
    private hasPreviousPageSubject = new BehaviorSubject<number>(0);
    private totalCategorySubject = new BehaviorSubject<number>(0);
    private totalPageSubject = new BehaviorSubject<number>(0);
    private elementPerPageSubject = new BehaviorSubject<number>(0);

    categories$: Observable<CategoryModel[] | undefined> = this.categoriesSubject.asObservable();
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
                    this.categoriesSubject.next(data.categories)
                    this.hasNextPageSubject.next(data.has_next_page);
                    this.hasPreviousPageSubject.next(data.has_previous_page);
                    this.totalCategorySubject.next(data.total);
                    
                    let totalPage = Math.ceil(this.totalCategorySubject.value / data.element_per_page);
                    this.totalPageSubject.next(totalPage);

                    this.elementPerPageSubject.next(data.element_per_page);
                }
            });
        }
        
    }

    onCreate() {
        
    }

    private resetCache() {
        this.cacheCategories.clear();
    }
}