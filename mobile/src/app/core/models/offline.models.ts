export type SyncAction = 'create' | 'update' | 'delete';
export type SyncState = 'local' | 'pending' | 'synced' | 'conflict';

export interface LocalEntity {
  localId: string;
  remoteId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface LocalTransaction extends LocalEntity {
  amount: number;
  occurredAt: string;
  isIncome: boolean;
  reason: string;
  categoryLocalId: string | null;
}

export interface LocalCategory extends LocalEntity {
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'outcome';
  budgetAmount: number | null;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'transaction' | 'category' | 'settings';
  entityLocalId: string;
  action: SyncAction;
  payload: string;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}
