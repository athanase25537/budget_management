import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = "http://127.0.0.1:8000";

  constructor(private httpClient: HttpClient) { }

  addUser(user: UserModel): Observable<{ status: string, user: UserModel}> {
      let data = {
        "name": user.name,
        "first_name": user.first_name,
        "password": user.password,
        "solde": 0,
        "username": user.username 
      }
      return this.httpClient
        .post<{status: string, user: any }>(this.apiUrl + "/user/add-user", data).pipe(
          map(response => {
            let user = new UserModel(
              response.user.id,
              response.user.name,
              response.user.first_name,
              response.user.username,
              response.user.password,
              response.user.solde
            )

            return {
              status: response.status,
              user: user
            }
          })
        )
    }
}
