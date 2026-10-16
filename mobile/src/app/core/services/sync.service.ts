import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LocalDatabaseService, ServerSnapshot } from '../data/local-database.service';
import { AccountService, API_URL } from './account.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private readonly database: LocalDatabaseService, private readonly account: AccountService, private readonly http: HttpClient) {}

  async synchronize(): Promise<{ categories: number; transactions: number }> {
    const headers = new HttpHeaders(await this.account.authorizationHeaders());
    const categories = await this.database.categorySyncChanges();
    const transactions = await this.database.transactionSyncChanges();
    for (const category of categories) {
      if (category.type === 'outcome' && category.budgetAmount === null) throw new Error(`La catégorie « ${category.name} » doit avoir un budget avant synchronisation.`);
    }
    const result = await firstValueFrom(this.http.post<SyncResponse>(`${API_URL}/sync/synchronize`, {
      categories: categories.map((item) => ({ client_id: item.localId, remote_id: item.remoteId, operation: item.operation, updated_at: item.updatedAt, name: item.name, color: item.color, type: item.type, budget_amount: item.budgetAmount })),
      transactions: transactions.map((item) => ({ client_id: item.localId, remote_id: item.remoteId, operation: item.operation, updated_at: item.updatedAt, amount: item.amount, is_in: item.isIncome, date: item.occurredAt, reason: item.reason || null, category_remote_id: item.categoryRemoteId, category_client_id: item.categoryLocalId })),
    }, { headers }));
    for (const item of result.applied) {
      if (item.entity === 'category') await this.database.markCategorySynced(item.client_id, item.remote_id);
      if (item.entity === 'transaction') await this.database.markTransactionSynced(item.client_id, item.remote_id);
    }
    await this.database.applyServerSnapshot(result);
    if (result.conflicts.length) throw new Error(`${result.conflicts.length} conflit(s) doivent être résolus avant la prochaine synchronisation.`);
    return { categories: result.applied.filter((item) => item.entity === 'category').length, transactions: result.applied.filter((item) => item.entity === 'transaction').length };
  }
}

interface SyncResponse extends ServerSnapshot {
  applied: Array<{ entity: 'category' | 'transaction'; client_id: string; remote_id: number }>;
  conflicts: Array<{ entity: string; client_id: string; reason: string }>;
}
