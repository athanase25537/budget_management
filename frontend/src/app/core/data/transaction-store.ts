import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { TransactionModel } from "../models/transaction-model";
import { BudgetService } from "../services/budget-service";
import { AuthService } from "../services/auth-service";
import { ToastService } from "../services/toast-service";

@Injectable({
    providedIn: 'root'
})

export class TransactionStore {
    private subject = new BehaviorSubject<TransactionModel[]>([]);

    transactions$: Observable<TransactionModel[]> = this.subject.asObservable();

    constructor(
        private budgetService: BudgetService,
        private authService: AuthService,
        private toastService: ToastService
    ) {
        this.getFirstTenTransactions();
    }

    private getFirstTenTransactions() {
        let user = this.authService.getCurrentUser();
        let userId = (user) ? user.id : -1
        this.budgetService.getFirstTenTransactions(userId).subscribe({
            next: (data: TransactionModel[]) => {
                this.subject.next(data);
                console.log("data", data)
            }, 
            error: (err) => {
                console.log("Error: ", err)
            }
        });
    }

    onUpdate(isUpdate: boolean, lastTransaction: TransactionModel) {
        if(isUpdate) {
            let transactions = this.subject.value
            let updatedTransactionIndex = transactions.findIndex((transaction) => transaction.id == lastTransaction.id)
            if(updatedTransactionIndex > 0) {
                transactions[updatedTransactionIndex] = lastTransaction;
                this.subject.next(transactions);
                console.log("sub", this.subject.value);
            }

      } else {
        let transactions = this.subject.value;
        transactions.unshift(lastTransaction);

        this.subject.next(transactions)
        if(transactions.length > 10) transactions.pop();
      }
    }

    onDelete(userId: number, transactionId: number) {
        this.budgetService.deleteTransaction(userId, transactionId).subscribe({
        next: () => {
            this.getFirstTenTransactions();
            // send message to toast
            this.toastService.show({ type: "error", message: "Transaction successfully deleted." })
        },
        error: (err) => {
            console.log("error:", err)
        }
      })
        
        console.log("sub", this.subject.value);
    }
}