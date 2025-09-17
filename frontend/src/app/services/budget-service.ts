import { TransactionModel } from './../models/transaction-model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserModel } from '../models/user-model';
import { map } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = environment.apiUrl;

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

  getAllTransaction(user_id: number): Observable<TransactionModel[]> {
    return this.httpClient
      .get<{ transaction: any[] }>(this.apiUrl + `/transaction/get-transaction-by-user-id?user_id=${user_id}`)
      .pipe(
        map(response => 
          response.transaction.map(el =>
            new TransactionModel(
              el.date,
              el.amount,
              el.is_in,
              el.id,
              el.user_id,
              el.reason
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
      "reason": transaction.reason
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
}
