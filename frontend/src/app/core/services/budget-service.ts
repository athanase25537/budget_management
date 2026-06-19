import { TransactionModel } from './../models/transaction-model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserModel } from '../models/user-model';
import { map } from 'rxjs';
import { environment } from '../../core/environments/environment';
import { CategoryModel } from '../models/category-model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = environment.apiUrl;
  private items_per_page = environment.items_per_page;
  private category_per_page = environment.category_per_page;

  constructor(private httpClient: HttpClient) { }

  welcome(): Observable<{ message: string }> {
    return this.httpClient.get<{ message: string }>(this.apiUrl+"/");
  }

  getUser(user_id: number): Observable<UserModel> {
    return this.httpClient.get<{ user: any }>(this.apiUrl+`/user/get-user-by-id?user_id=${user_id}`).pipe(
      map(response => {
        return  new UserModel(
          response.user["id"],
          response.user["name"],
          response.user["first_name"],
          response.user["username"],
          response.user["password"],
          response.user["solde"]
        )
      })
    )
  }

  getAmountIn(user_id: number): Observable<{ status: string, amount_in: number }> {
    return this.httpClient.get<{ status: string, amount_in: number} >(this.apiUrl+`/transaction/get-amount-in?user_id=${user_id}`)
  }

  getAmountOut(user_id: number): Observable<{ status: string, amount_out: number }> {
    return this.httpClient.get<{ status: string, amount_out: number} >(this.apiUrl+`/transaction/get-amount-out?user_id=${user_id}`)
  }

  getAllTransaction(user_id: number, page: number = 1): Observable<TransactionModel[]> {
    return this.httpClient
      .get<{ transaction: any[] }>(this.apiUrl + `/transaction/get-transactions-by-user-id?user_id=${user_id}&page=${page}&items_per_page=${this.items_per_page}`)
      .pipe(
        map(response => 
          response.transaction.map(el =>
            new TransactionModel(
              el.date,
              el.amount,
              el.is_in,
              el.id,
              el.user_id,
              el.reason,
              (el.category) ? el.category : "Non defini",
              undefined,
            )
          )
        )
    );
  }

  getFirstTenTransactions(user_id: number, page: number = 1): Observable<TransactionModel[]> {
    return this.httpClient
      .get<{ transaction: any[] }>(this.apiUrl + `/transaction/get-transactions-by-user-id?user_id=${user_id}&page=${page}&items_per_page=10`)
      .pipe(
        map(response => 
          response.transaction.map(el =>
            new TransactionModel(
              el.date,
              el.amount,
              el.is_in,
              el.id,
              el.user_id,
              el.reason,
              (el.category) ? el.category : "Non defini",
              undefined,
            )
          )
        )
    );
  }


  addTransaction(transaction: TransactionModel): Observable<string> {
    let data = {
      "amount": transaction.amount,
      "is_in": transaction.is_in,
      "user_id": transaction.user_id,
      "date": transaction.date,
      "reason": transaction.reason,
      "category_id": transaction.category_id
    }
    return this.httpClient
      .post<{status: string, transaction: any }>(this.apiUrl + "/transaction/create-transaction", data)
      .pipe(
        map(response => response.status)
      )
  }

  deleteTransaction(user_id: number, transactionId: number) {
    return this.httpClient
      .delete(this.apiUrl + `/transaction/delete-transaction-by_transaction-id?user_id=${user_id}&transaction_id=${transactionId}`)
  }

  getCategoriesByUserId(user_id: number, page: number = 1): Observable<{
    categories: CategoryModel[],
    has_next_page: boolean,
    has_previous_page: boolean,
    current_page: number,
    element_per_page: number,
    total: number
  }> {
    return this.httpClient.get<{
      categories: CategoryModel[],
      has_next_page: boolean,
      has_previous_page: boolean,
      current_page: number,
      element_per_page: number,
      total: number
    }>(this.apiUrl + `/category/get-categories-by-user-id?user_id=${user_id}&page=${page}&items_per_page=${this.category_per_page}`).pipe(
      map(response => {
        response.categories.map(el => new CategoryModel(el.id, el.name, el.user_id, el.color))
        return response
      })
    );
  }

  getAllCategoriesByUserId(user_id: number): Observable<CategoryModel[]> {
    return this.httpClient.get<{categories: any[]}>(this.apiUrl + `/category/get-all-categories-by-user-id?user_id=${user_id}`).pipe(
      map(response => response.categories.map(el => new CategoryModel(el.id, el.name, el.user_id, el.color)))
    );
  }

  createCategory(category: CategoryModel): Observable<string> {
    let data = {
      "name": category.name,
      "user_id": category.user_id,
      "color": category.color
    }
    return this.httpClient
      .post<{status: string, category: any }>(this.apiUrl + "/category/create-category", data)
      .pipe(
        map(response => response.status)
      )
  }
}
