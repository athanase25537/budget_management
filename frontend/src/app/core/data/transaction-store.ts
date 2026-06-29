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
            }, 
            error: (err) => {
                console.log("Error: ", err)
            }
        });
    }

    onUpdate(updatedTransaction: TransactionModel) {
        this.budgetService.updateTransactionById(updatedTransaction).subscribe({
            next: () => {
                this.toastService.show({ type: "update", message: "Transaction successfully updated." })
                let transactions = this.subject.value
                let updatedTransactionIndex = transactions.findIndex((transaction) => transaction.id == updatedTransaction.id)
                if(updatedTransactionIndex > -1) {
                    transactions[updatedTransactionIndex] = updatedTransaction;
                    this.subject.next(transactions);
                };

                // console.log("ATO222")
            },
            error: (err) => {
                // Gestion fine des erreurs API
                // if (err.status === 0) {
                //   this.errorMessage = 'Cannot reach the server. Please try again later.';
                // } else if (err.status === 400) {
                //   this.errorMessage = 'Invalid request. Please check your data.';
                // } else if (err.status === 401) {
                //   this.errorMessage = 'You are not authorized. Please log in again.';
                // } else {
                //   this.errorMessage = 'An unexpected error occurred. Please try again.';
                // }
                console.log("Error", err)
            }
        });
    }
    
    onCreate(newTransaction: TransactionModel) {
        this.budgetService.addTransaction(newTransaction).subscribe({
          next: (data: { status: string, transaction: TransactionModel }) => {

            let transactions = this.subject.value;
            transactions.unshift(data.transaction);
            if(transactions.length > 10) transactions.pop();
            this.subject.next(transactions)

            this.toastService.show({ type: "create", message: "Transaction successfully created." })
          },
          error: (err) => {
            console.error(err);
            // this.sendTransaction = false;
            // this.errorTransaction = true;

            // // Gestion fine des erreurs API
            // if (err.status === 0) {
            //   this.errorMessage = 'Cannot reach the server. Please try again later.';
            // } else if (err.status === 400) {
            //   this.errorMessage = 'Invalid request. Please check your data.';
            // } else if (err.status === 401) {
            //   this.errorMessage = 'You are not authorized. Please log in again.';
            // } else {
            //   this.errorMessage = 'An unexpected error occurred. Please try again.';
            // }
          }
        });
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
    }
}