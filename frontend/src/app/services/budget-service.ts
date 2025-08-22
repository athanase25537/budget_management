import { TransactionModel } from './../models/transaction-model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, Observable, ObservedValueOf, tap } from 'rxjs';
import { UserModel } from '../models/user-model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  // private apiUrl = "https://budget-management-backend-jwjl.onrender.com";
  private apiUrl = "http://127.0.0.1:8000";

  constructor(private httpClient: HttpClient) { }

  welcome(): Observable<{ message: string }> {
    return this.httpClient.get<{ message: string }>(this.apiUrl+"/");
  }

  getUser(): Observable<UserModel> {
    return this.httpClient.get<{ user: any }>(this.apiUrl+"/user/get-user-by-id?user_id=1").pipe(
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

  getAmountIn(): Observable<{ status: string, amount_in: number }> {
    return this.httpClient.get<{ status: string, amount_in: number} >(this.apiUrl+"/transaction/get-amount-in?user_id=1")
  }

  getAmountOut(): Observable<{ status: string, amount_out: number }> {
    console.log("we are here ...")
    return this.httpClient.get<{ status: string, amount_out: number} >(this.apiUrl+"/transaction/get-amount-out?user_id=1")
  }

  getAllTransaction(): Observable<TransactionModel[]> {
    return this.httpClient
      .get<{ transaction: any[] }>(this.apiUrl + "/transaction/get-transaction-by-user-id?user_id=1")
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
        ),
        delay(3000)
      );
    }
  }
