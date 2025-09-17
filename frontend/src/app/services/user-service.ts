import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = environment.apiUrl;

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

  updateUser(user: UserModel): Observable<{ status: string, user: UserModel}> {
    let data = {
      "name": user.name,
      "first_name": user.first_name,
      "password": user.password,
      "username": user.username 
    }
    return this.httpClient
      .put<{status: string, user: any }>(this.apiUrl + `/user/user-update-by-id/${user.id}`, data).pipe(
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

  deleteUser(user_id: number) {
    console.log("iiiii")
    return this.httpClient.delete(this.apiUrl + `/user/delete-user-by-id/${user_id}`)  
  }
}
