import { Injectable } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { TransactionModel } from "../models/transaction-model";
import { BudgetService } from "../services/budget-service";
import { ToastService } from "../services/toast-service";
import { SettingsService } from "../services/settings-service";
import { SettingsModel } from "../models/settings-model";
import { CategoryModel } from "../models/category-model";
import { TableTransactionModel } from "../models/table-transaction-model";

@Injectable({
    providedIn: 'root'
})

export class TransactionStore {

    private firstTransactionsSubject = new BehaviorSubject<TableTransactionModel>({
        transactions: [],
        has_next_page: false,
        has_previous_page: false,
        current_page: 1,
        element_per_page: 10,
        total: 10,
        need_footer: false
    });

    private cacheTransactions = new Map<number, TableTransactionModel>();

    private transactionsSubject = new BehaviorSubject<TableTransactionModel>({
        transactions: [],
        has_next_page: false,
        has_previous_page: false,
        current_page: 1,
        element_per_page: 10,
        total: 10,
        need_footer: true
    });

    private soldeSubject = new BehaviorSubject<number | undefined>(undefined);
    private amountInSubject = new BehaviorSubject<number | undefined>(undefined);
    private amountOutSubject = new BehaviorSubject<number | undefined>(undefined);
    private saveSubject = new BehaviorSubject<number | undefined>(undefined); // ex: 150 000 MGA for 30% of 500 000 MGA
    private saveSettingSubject = new BehaviorSubject<number>(0); // ex: 20%, 30%, ...
    itemLoadingSubject = new BehaviorSubject<boolean>(true);

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

    defaultCategoriesSubject = new BehaviorSubject<CategoryModel[] | undefined>(undefined);

    private settingSubject = new BehaviorSubject<SettingsModel>({
        id: -1,
        economy: 0,
        min_val_stat: 0,
        max_val_stat: 0,
        increment: 0,
        user_id: -1
    });

    solde$: Observable<number | undefined> = this.soldeSubject.asObservable();
    amountIn$: Observable<number | undefined> = this.amountInSubject.asObservable();
    amountOut$: Observable<number | undefined> = this.amountOutSubject.asObservable();
    firstTransactions$: Observable<TableTransactionModel> = this.firstTransactionsSubject.asObservable();
    
    transactions$: Observable<TableTransactionModel> = this.transactionsSubject.asObservable();
    save$: Observable<number | undefined> = this.saveSubject.asObservable();
    setting$: Observable<SettingsModel> = this.settingSubject.asObservable();
    saveSetting$: Observable<number> = this.saveSettingSubject.asObservable();
    itemLoading$: Observable<boolean> = this.itemLoadingSubject.asObservable();

    private currentPage: number = 1;

    private userId!: number;

    setUserId(userId: number) {
        this.userId = userId;
    }

    getUserId(): number {
        return this.userId;
    }

    constructor(
        private budgetService: BudgetService,
        private toastService: ToastService,
        private settingsService: SettingsService,
    ) { }

    updateSetting() {

        this.settingsService.settings$.subscribe(settings => {
            if (settings) {
                let saveSetting = settings.economy ?? 0;
                let save = (this.amountInSubject.value) ? this.amountInSubject.value * saveSetting / 100 : 0;

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

    initializeStore() {

        this.getFirstTenTransactions();
        this.getMiniCardData();

    }

    getFirstTenTransactions() {

        if(this.firstTransactionsSubject.value.transactions.length <= 0) {

            this.resetTransactions();

        }

    }

    resetTransactions() {
        this.budgetService.getFirstTenTransactions(this.userId).subscribe({
            next: (data: TransactionModel[]) => {
                let formatData: TableTransactionModel = {
                    transactions: data,
                    has_next_page: this.firstTransactionsSubject.value.has_next_page,
                    has_previous_page: this.firstTransactionsSubject.value.has_previous_page,
                    current_page: this.firstTransactionsSubject.value.current_page,
                    element_per_page: this.firstTransactionsSubject.value.element_per_page,
                    total: this.firstTransactionsSubject.value.total,
                    need_footer: false
                }

                console.log("First ten transactions:", formatData);

                this.firstTransactionsSubject.next(formatData);
                this.itemLoadingSubject.next(false);
                
            }, 
            error: (err) => {
                this.itemLoadingSubject.next(false);
                console.log("Error: ", err)
            }
        });
    }

    getAllTransactions(page: number = 1) {

        this.currentPage = page;

        if(this.cacheTransactions.has(page)) {
            const cacheData = this.cacheTransactions.get(page);
            if(cacheData) this.transactionsSubject.next(cacheData);

            console.log("Transactions from cache:", cacheData);
            this.itemLoadingSubject.next(false);
        } else {
            this.budgetService.getAllTransactionByUserId(this.userId, page).subscribe({
                next: (data: any) => {
                    let formatData: TableTransactionModel = {
                        transactions: data.transactions,
                        has_next_page: data.has_next_page,
                        has_previous_page: data.has_previous_page,
                        current_page: data.current_page,
                        element_per_page: data.element_per_page,
                        total: data.total,
                        need_footer: true
                    }

                    this.cacheTransactions.set(page, formatData)
                    const cacheData = this.cacheTransactions.get(page)
                    if(cacheData) this.transactionsSubject.next(cacheData);

                    this.itemLoadingSubject.next(false);
                    console.log("Transactions from API:", formatData);
                },
                error: (err) => {
                    this.itemLoadingSubject.next(false);
                    console.log("Erreur:", err)
                }
            });

        }

    }
    


    onUpdate(updatedTransaction: TransactionModel) {

        this.itemLoadingSubject.next(true);
        this.budgetService.updateTransactionById(updatedTransaction).subscribe({
            next: () => {
                this.toastService.show({ type: "update", message: "Transaction successfully updated." })
                let transactions = this.firstTransactionsSubject.value.transactions
                let updatedTransactionIndex = transactions.findIndex((transaction) => transaction.id == updatedTransaction.id)
                if(updatedTransactionIndex > -1) {
                    transactions[updatedTransactionIndex] = updatedTransaction;

                    this.firstTransactionsSubject.value.transactions = transactions;
                    const data = this.firstTransactionsSubject.value;

                    this.firstTransactionsSubject.next(data);

                };

                this.lastTransactionUpdated.next(updatedTransaction);

                // reset cache
                this.resetCache(this.currentPage);
                
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

        this.itemLoadingSubject.next(true);
        this.budgetService.addTransaction(newTransaction).subscribe({
          next: (data: { status: string, transaction: TransactionModel }) => {

            let transactions = this.firstTransactionsSubject.value.transactions;
            transactions.unshift(data.transaction);
            if(transactions.length > 10) transactions.pop();
            this.firstTransactionsSubject.value.transactions = transactions;
            const d = this.firstTransactionsSubject.value;
            this.firstTransactionsSubject.next(d);

            // reset cache
            this.resetCache(this.currentPage);

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

        this.itemLoadingSubject.next(true);
        this.budgetService.deleteTransaction(this.userId, transactionId).subscribe({
        next: () => {
            let transactions = this.firstTransactionsSubject.value.transactions
            let deletedTransaction = transactions.find((transaction) => transaction.id == transactionId);
            if(deletedTransaction) {
                this.updateMiniCardDataonDelete(deletedTransaction);
            }
            
            this.resetTransactions();

            // reset cache
            this.resetCache(this.currentPage);

            // send message to toast
            this.toastService.show({ type: "error", message: "Transaction successfully deleted." })
        },
        error: (err) => {
            console.log("error:", err)
        }
      })

    }

    getMiniCardData() {
        
        if(this.soldeSubject.value == undefined || this.amountInSubject.value == undefined || this.amountOutSubject.value == undefined) {
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

    }

    updateMiniCardData(isUpdate: boolean, transaction: TransactionModel) {

        let newAmount = transaction.amount;
        let isIn = transaction.is_in;
        let amountIn = (this.amountInSubject.value) ? this.amountInSubject.value : 0;
        let amountOut = (this.amountOutSubject.value) ? this.amountOutSubject.value : 0;
        if(isUpdate) {
            let lastAmount = this.lastTransactionUpdated.value.amount;
            if(isIn) {
                if(this.lastTransactionUpdated.value.is_in) { // before : income => after: income
                    this.amountInSubject.next(amountIn - lastAmount + newAmount);
                } else { // before : outcome => after: income
                    this.amountOutSubject.next(amountOut - lastAmount);
                    this.amountInSubject.next(amountIn + newAmount);
                }
            } else {
                if(this.lastTransactionUpdated.value.is_in) { // before : income => after: outcome
                    this.amountInSubject.next(amountIn - lastAmount);
                    this.amountOutSubject.next(amountOut + newAmount);
                } else { // before : outcome => after: outcome
                    this.amountOutSubject.next(amountOut - lastAmount + newAmount);
                }
            }
        } else {
            if(isIn) {
                this.amountInSubject.next(amountIn + newAmount);
            } else {
                this.amountOutSubject.next(amountOut + newAmount)
            }
        }

        this.updateSoldeAndSaveCard();

    }

    private updateMiniCardDataonDelete(transaction: TransactionModel) {

        let newAmount = transaction.amount;
        let isIn = transaction.is_in;

        let amountIn = (this.amountInSubject.value) ? this.amountInSubject.value : 0;
        let amountOut = (this.amountOutSubject.value) ? this.amountOutSubject.value : 0;

        if(isIn) {
            this.amountInSubject.next(amountIn - newAmount);
        } else {
            this.amountOutSubject.next(amountOut - newAmount)
        }

        this.updateSoldeAndSaveCard();

    }

    private updateSoldeAndSaveCard() {

        let amountIn = (this.amountInSubject.value) ? this.amountInSubject.value : 0;
        let amountOut = (this.amountOutSubject.value) ? this.amountOutSubject.value : 0;
        let newSave = amountIn * this.saveSettingSubject.value / 100;
        let newSolde = amountIn - newSave - amountOut;
        
        this.saveSubject.next(newSave);
        this.soldeSubject.next(newSolde);
            
    }

    updateSettingReq(settingData: SettingsModel) {

        settingData.id = this.settingSubject.value.id;
        settingData.user_id = this.userId;
        this.settingsService.updateSettingsByUserId(settingData).subscribe({
            next: (updatedSettings) => {
                this.updateSetting();
                },
            error: (err) => {
            console.error("Error while updating settings:", err);
            }
        });
    }

    getDefaultCategories() {

        if(this.defaultCategoriesSubject.value == undefined) {
            this.budgetService.getAllCategoriesByUserId(this.userId).subscribe({
                next: (categories) => {
                    this.defaultCategoriesSubject.next(categories);
                },
                error: (err) => {
                    console.error('Error fetching default categories:', err);
                }
            });
        }

    }

    private resetCache(page: number) {

        this.cacheTransactions.clear();

        this.getAllTransactions(page);

    }

}