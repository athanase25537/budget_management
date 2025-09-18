import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { SettingsModel } from '../models/settings-model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private apiUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  // Créer de nouveaux paramètres
  createSettings(settings: SettingsModel): Observable<{ status: string, settings: SettingsModel }> {
    return this.httpClient
      .post<{ status: string, setting: any }>(this.apiUrl + "/setting/create-setting", settings)
      .pipe(
        map(response => ({
          status: response.status,
          settings: this.mapToSettingsModel(response.setting)
        }))
      );
  }

  // Récupérer les paramètres par user_id
  getSettings(userId: number): Observable<SettingsModel> {
    return this.httpClient
      .get<any>(this.apiUrl + `/setting/get-setting-by-user-id/${userId}`)
      .pipe(
        map(response => this.mapToSettingsModel(response.setting || response))
      );
  }

  // Mettre à jour les paramètres par user_id (alternative)
  updateSettingsByUserId(userId: number, settings: SettingsModel): Observable<{ status: string, settings: SettingsModel }> {
    return this.httpClient
      .put<{ status: string, setting: any }>(this.apiUrl + `/setting/update-setting-by-user-id/${userId}`, settings)
      .pipe(
        map(response => ({
          status: response.status,
          settings: this.mapToSettingsModel(response.setting)
        }))
      );
  }

  // Supprimer les paramètres
  deleteSettings(settingsId: number): Observable<{ status: string }> {
    return this.httpClient
      .delete<{ status: string }>(this.apiUrl + `/setting/delete-setting-by-id/${settingsId}`);
  }

  // Mapper la réponse API vers le modèle SettingsModel
  private mapToSettingsModel(data: any): SettingsModel {
    console.log(data)
    return {
      id: data.id,
      economy: data.economy,
      min_val_stat: data.min_val_stat,
      max_val_stat: data.max_val_stat,
      increment: data.increment,
      user_id: data.user_id
    };
  }
}