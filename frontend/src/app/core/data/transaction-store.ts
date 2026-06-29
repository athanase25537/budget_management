import { Injectable } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { TransactionModel } from "../models/transaction-model";
import { BudgetService } from "../services/budget-service";
import { AuthService } from "../services/auth-service";
import { ToastService } from "../services/toast-service";
import { SettingsService } from "../services/settings-service";
import { SettingsModel } from "../models/settings-model";

@Injectable({
    providedIn: 'root'
})

export class TransactionStore {
    private subject = new BehaviorSubject<TransactionModel[]>([]);
    private soldeSubject = new BehaviorSubject<number>(0);
    private amountInSubject = new BehaviorSubject<number>(0);
    private amountOutSubject = new BehaviorSubject<number>(0);
    private saveSubject = new BehaviorSubject<number>(0); // ex: 150 000 MGA for 30% of 500 000 MGA
    private saveSettingSubject = new BehaviorSubject<number>(0); // ex: 20%, 30%, ...
    lastTransactionUpdated = new BehaviorSubject<TransactionModel>({
        date: "",
        amount: 0,
        is_in: false,
        id: -1,
        user_id: -1,
        reason: "",
        category_name: "",
        category_id: -1,
        category_color: "",
    });

    private settingSubject = new BehaviorSubject<SettingsModel>({
        id: -1,
        economy: 0,
        min_val_stat: 0,
        max_val_stat: 0,
        increment: 0,
        user_id: -1
    });

    solde$: Observable<number> = this.soldeSubject.asObservable();
    amountIn$: Observable<number> = this.amountInSubject.asObservable();
    amountOut$: Observable<number> = this.amountOutSubject.asObservable();
    transactions$: Observable<TransactionModel[]> = this.subject.asObservable();
    save$: Observable<number> = this.saveSubject.asObservable();
    setting$: Observable<SettingsModel> = this.settingSubject.asObservable();
    saveSetting$: Observable<number> = this.saveSettingSubject.asObservable();

    private userId!: number;

    constructor(
        private budgetService: BudgetService,
        private authService: AuthService,
        private toastService: ToastService,
        private settingsService: SettingsService,
    ) {

        let user = this.authService.getCurrentUser();
        this.userId = (user) ? user.id : -1;

        if(user) {
            this.getFirstTenTransactions();
            this.getMiniCardData();
        }

    }

    updateSetting() {

        this.settingsService.settings$.subscribe(settings => {
            if (settings) {
                let saveSetting = settings.economy ?? 0;
                let save = this.amountInSubject.value * saveSetting / 100;

                let setting = {
                    id: settings.id,
                    economy: save,
                    min_val_stat: settings.min_val_stat,
                    max_val_stat: settings.max_val_stat,
                    increment: settings.increment,
                    user_id: settings.user_id
                }

                this.settingSubject.next(setting);
                this.saveSettingSubject.next(settings.economy)
                this.saveSubject.next(save);

                this.updateSoldeAndSaveCard();
            }
        });

    }

    private getFirstTenTransactions() {
        this.budgetService.getFirstTenTransactions(this.userId).subscribe({
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

                this.lastTransactionUpdated.next(updatedTransaction);

                
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

    onDelete(transactionId: number) {

        this.budgetService.deleteTransaction(this.userId, transactionId).subscribe({
        next: () => {
            let transactions = this.subject.value
            let deletedTransaction = transactions.find((transaction) => transaction.id == transactionId);
            if(deletedTransaction) {
                this.updateMiniCardDataonDelete(deletedTransaction);
            }
            
            this.getFirstTenTransactions();
            // send message to toast
            this.toastService.show({ type: "error", message: "Transaction successfully deleted." })
        },
        error: (err) => {
            console.log("error:", err)
        }
      })

    }

    getMiniCardData() {
        
        forkJoin({
            user: this.budgetService.getUser(this.userId),
            amountIn: this.budgetService.getAmountIn(this.userId),
            amountOut: this.budgetService.getAmountOut(this.userId)
        }).subscribe({
            next: (result) => {
                this.soldeSubject.next(result.user.solde);
                this.amountInSubject.next(result.amountIn.amount_in ?? 0);
                this.amountOutSubject.next(result.amountOut.amount_out ?? 0);

                this.updateSetting();
            },
            error: (err) => {
                console.error("Erreur :", err);
            },
            complete: () => {
                console.log("Toutes les requêtes sont terminées.");
            }
        });

    }

    updateMiniCardData(isUpdate: boolean, transaction: TransactionModel) {
        let newAmount = transaction.amount;
        let isIn = transaction.is_in;

        if(isUpdate) {
            let lastAmount = this.lastTransactionUpdated.value.amount;
            if(isIn) {
                if(this.lastTransactionUpdated.value.is_in) { // before : income => after: income
                    this.amountInSubject.next(this.amountInSubject.value - lastAmount + newAmount);
                } else { // before : outcome => after: income
                   this.amountOutSubject.next(this.amountOutSubject.value - lastAmount);
                   this.amountInSubject.next(this.amountInSubject.value + newAmount);
                }
            } else {
                if(this.lastTransactionUpdated.value.is_in) { // before : income => after: outcome
                    this.amountInSubject.next(this.amountInSubject.value - lastAmount);
                    this.amountOutSubject.next(this.amountOutSubject.value + newAmount);
                } else { // before : outcome => after: outcome
                    this.amountOutSubject.next(this.amountOutSubject.value - lastAmount + newAmount);
                }
            }
        } else {
            if(isIn) {
                this.amountInSubject.next(this.amountInSubject.value + newAmount);
            } else {
                this.amountOutSubject.next(this.amountOutSubject.value + newAmount)
            }
        }

        this.updateSoldeAndSaveCard();

    }

    private updateMiniCardDataonDelete(transaction: TransactionModel) {
        let newAmount = transaction.amount;
        let isIn = transaction.is_in;

        if(isIn) {
            this.amountInSubject.next(this.amountInSubject.value - newAmount);
        } else {
            this.amountOutSubject.next(this.amountOutSubject.value - newAmount)
        }

        this.updateSoldeAndSaveCard();

    }

    private updateSoldeAndSaveCard() {

        let newSave = this.amountInSubject.value * this.saveSettingSubject.value / 100;
        let newSolde = this.amountInSubject.value - newSave - this.amountOutSubject.value;
        
        this.saveSubject.next(newSave);
        this.soldeSubject.next(newSolde);
            
    }

    updateSettingReq(settingData: SettingsModel) {
        settingData.id = this.settingSubject.value.id;
        settingData.user_id = this.userId;
        this.settingsService.updateSettingsByUserId(this.userId, settingData).subscribe({
            next: (updatedSettings) => {
                this.updateSetting();
                console.info("Settings updated successfully", updatedSettings);
                },
                error: (err) => {
                console.error("Error while updating settings:", err);
                }
        });
    }

}