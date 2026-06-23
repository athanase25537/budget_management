import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { TransactionModel } from "../models/transaction-model";
import { BudgetService } from "../services/budget-service";
import { AuthService } from "../services/auth-service";

@Injectable({
    providedIn: 'root'
})

export class TransactionStore {
    private subject = new BehaviorSubject<TransactionModel[]>([]);

    transactions$: Observable<TransactionModel[]> = this.subject.asObservable();

    constructor(
        private budgetService: BudgetService,
        private authService: AuthService
    ) {
        this.getFirstTenTransactions();
    }

    private getFirstTenTransactions() {
        let user = this.authService.getCurrentUser();
        let userId = (user) ? user.id : -1
        this.budgetService.getFirstTenTransactions(userId).subscribe({
            next: (data: TransactionModel[]) => {
                this.subject.next(data);
            }, 
            error: (err) => {
                console.log("Error: ", err)
            }
        });
    }
}