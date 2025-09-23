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

  addUser(user: UserModel): Observable<{ status: string; user: UserModel | null; message?: string }> {
    const data = {
      name: user.name,
      first_name: user.first_name,
      password: user.password,
      solde: 0,
      username: user.username 
    };

    return this.httpClient
      .post<{ status: string; user?: any; message?: string }>(`${this.apiUrl}/user/add-user`, data)
      .pipe(
        map(response => {

          if (response.user) {
            const mappedUser = new UserModel(
              response.user.id,
              response.user.name,
              response.user.first_name,
              response.user.username,
              response.user.password,
              response.user.solde
            );
            return { status: response.status, user: mappedUser };
          }

          return { status: response.status, user: null, message: response.message };
        })
      );
  }

  updateUser(user: UserModel): Observable<{ status: string; user: UserModel | null; message?: string }> {
    const data = {
      name: user.name,
      first_name: user.first_name,
      password: user.password,
      username: user.username 
    };

    return this.httpClient
      .put<{ status: string; user?: any; message?: string }>(`${this.apiUrl}/user/user-update-by-id/${user.id}`, data)
      .pipe(
        map(response => {

          if (response.user) {
            const mappedUser = new UserModel(
              response.user.id,
              response.user.name,
              response.user.first_name,
              response.user.username,
              response.user.password,
              response.user.solde
            );
            return { status: response.status, user: mappedUser };
          }

          return { status: response.status, user: null, message: response.message };
        })
      );
  }

  deleteUser(user_id: number) {
    return this.httpClient.delete(`${this.apiUrl}/user/delete-user-by-id/${user_id}`);  
  }
}