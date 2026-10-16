import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DEFAULT_CATEGORY_ICON } from '../models/category-icons';
import { LocalCategory, LocalTransaction, SyncAction } from '../models/offline.models';

/**
 * Local persistence is the source of truth for the mobile app. Native SQLite
 * wiring and repository methods will be added before feature implementation.
 */
@Injectable({ providedIn: 'root' })
export class LocalDatabaseService {
  private readonly databaseName = 'kajy-vola';
  private connection?: SQLiteDBConnection;
  private initialized = false;
  private initializationPromise?: Promise<void>;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.initializationPromise) this.initializationPromise = this.openDatabase();
    await this.initializationPromise;
  }

  private async openDatabase(): Promise<void> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    if (Capacitor.getPlatform() === 'web') {
      await sqlite.initWebStore();
    }

    const consistency = await sqlite.checkConnectionsConsistency();
    const isOpen = consistency.result && (await sqlite.isConnection(this.databaseName, false)).result;
    this.connection = isOpen
      ? await sqlite.retrieveConnection(this.databaseName, false)
      : await sqlite.createConnection(this.databaseName, false, 'no-encryption', 1, false);

    await this.connection.open();
    await this.connection.execute(SCHEMA, false);
    await this.ensureCategoryIconColumn();
    this.initialized = true;
  }

  async listCategories(type?: LocalCategory['type']): Promise<LocalCategory[]> {
    const rows = await this.query<CategoryRow>(
      `SELECT * FROM categories WHERE deleted_at IS NULL ${type ? 'AND type = ?' : ''} ORDER BY name COLLATE NOCASE`,
      type ? [type] : [],
    );
    return rows.map(categoryFromRow);
  }

  async createCategory(input: Pick<LocalCategory, 'name' | 'color' | 'icon' | 'type' | 'budgetAmount'>): Promise<void> {
    const now = new Date().toISOString();
    const localId = crypto.randomUUID();
    await this.run(
      `INSERT INTO categories (local_id, remote_id, name, color, icon, type, budget_amount, created_at, updated_at, deleted_at, sync_state)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending')`,
      [localId, input.name.trim(), input.color, input.icon, input.type, input.budgetAmount, now, now],
    );
    await this.enqueue('category', localId, 'create', { localId, ...input, createdAt: now });
  }

  async createTransaction(input: Pick<LocalTransaction, 'amount' | 'occurredAt' | 'isIncome' | 'reason' | 'categoryLocalId'>): Promise<void> {
    const now = new Date().toISOString();
    const localId = crypto.randomUUID();
    await this.run(
      `INSERT INTO transactions (local_id, remote_id, amount, occurred_at, is_income, reason, category_local_id, created_at, updated_at, deleted_at, sync_state)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending')`,
      [localId, input.amount, input.occurredAt, input.isIncome ? 1 : 0, input.reason.trim(), input.categoryLocalId, now, now],
    );
    await this.enqueue('transaction', localId, 'create', { localId, ...input, createdAt: now });
  }

  async getTransaction(localId: string): Promise<LocalTransaction | null> {
    const rows = await this.query<TransactionRow>(`SELECT t.*, NULL AS category_name, NULL AS category_color, NULL AS category_icon FROM transactions t WHERE local_id = ? AND deleted_at IS NULL`, [localId]);
    return rows[0] ? transactionFromRow(rows[0]) : null;
  }

  async updateTransaction(localId: string, input: Pick<LocalTransaction, 'amount' | 'occurredAt' | 'isIncome' | 'reason' | 'categoryLocalId'>): Promise<void> {
    const now = new Date().toISOString();
    await this.run(`UPDATE transactions SET amount = ?, occurred_at = ?, is_income = ?, reason = ?, category_local_id = ?, updated_at = ?, sync_state = 'pending' WHERE local_id = ?`, [input.amount, input.occurredAt, input.isIncome ? 1 : 0, input.reason.trim(), input.categoryLocalId, now, localId]);
    await this.replaceQueuedChange('transaction', localId, 'update');
  }

  async deleteTransaction(localId: string): Promise<void> {
    const now = new Date().toISOString();
    const remote = await this.query<{ remote_id: number | null }>(`SELECT remote_id FROM transactions WHERE local_id = ?`, [localId]);
    if (!remote[0]?.remote_id) { await this.run(`DELETE FROM sync_queue WHERE entity_type = 'transaction' AND entity_local_id = ?`, [localId]); await this.run(`DELETE FROM transactions WHERE local_id = ?`, [localId]); return; }
    await this.run(`UPDATE transactions SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE local_id = ?`, [now, now, localId]);
    await this.replaceQueuedChange('transaction', localId, 'delete');
  }

  async updateCategory(localId: string, input: Pick<LocalCategory, 'name' | 'color' | 'icon' | 'type' | 'budgetAmount'>): Promise<void> {
    const now = new Date().toISOString();
    await this.run(`UPDATE categories SET name = ?, color = ?, icon = ?, type = ?, budget_amount = ?, updated_at = ?, sync_state = 'pending' WHERE local_id = ?`, [input.name.trim(), input.color, input.icon, input.type, input.budgetAmount, now, localId]);
    await this.replaceQueuedChange('category', localId, 'update');
  }

  async deleteCategory(localId: string): Promise<void> {
    const now = new Date().toISOString();
    const transactionRows = await this.query<{ count: number }>(`SELECT COUNT(*) AS count FROM transactions WHERE category_local_id = ? AND deleted_at IS NULL`, [localId]);
    if (Number(transactionRows[0]?.count ?? 0) > 0) throw new Error('Une catégorie avec des transactions ne peut pas être supprimée.');
    const remote = await this.query<{ remote_id: number | null }>(`SELECT remote_id FROM categories WHERE local_id = ?`, [localId]);
    if (!remote[0]?.remote_id) { await this.run(`DELETE FROM sync_queue WHERE entity_type = 'category' AND entity_local_id = ?`, [localId]); await this.run(`DELETE FROM categories WHERE local_id = ?`, [localId]); return; }
    await this.run(`UPDATE categories SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE local_id = ?`, [now, now, localId]);
    await this.replaceQueuedChange('category', localId, 'delete');
  }

  async listTransactions(): Promise<Array<LocalTransaction & { categoryName: string | null; categoryColor: string | null; categoryIcon: string | null }>> {
    const rows = await this.query<TransactionRow>(`
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM transactions t LEFT JOIN categories c ON c.local_id = t.category_local_id
      WHERE t.deleted_at IS NULL ORDER BY t.occurred_at DESC, t.created_at DESC`);
    return rows.map(transactionFromRow);
  }

  async dashboard(): Promise<{ income: number; expenses: number; balance: number; pendingChanges: number }> {
    const rows = await this.query<{ income: number; expenses: number; pending_changes: number }>(`
      SELECT
        COALESCE(SUM(CASE WHEN is_income = 1 THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN is_income = 0 THEN amount ELSE 0 END), 0) AS expenses,
        (SELECT COUNT(*) FROM sync_queue) AS pending_changes
      FROM transactions WHERE deleted_at IS NULL`);
    const result = rows[0] ?? { income: 0, expenses: 0, pending_changes: 0 };
    return { income: Number(result.income), expenses: Number(result.expenses), balance: Number(result.income) - Number(result.expenses), pendingChanges: Number(result.pending_changes) };
  }

  async getPreferences(): Promise<MobilePreferences> {
    const rows = await this.query<MobilePreferences>(`SELECT economy, min_val_stat AS minValStat, max_val_stat AS maxValStat, increment, language, theme FROM settings WHERE id = 1`);
    if (rows[0]) return rows[0];
    const defaults: MobilePreferences = { economy: 30, minValStat: 100, maxValStat: 100000, increment: 1000, language: 'fr', theme: 'light' };
    await this.run(`INSERT INTO settings (id, economy, min_val_stat, max_val_stat, increment, language, theme, updated_at, sync_state) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 'local')`, [defaults.economy, defaults.minValStat, defaults.maxValStat, defaults.increment, defaults.language, defaults.theme, new Date().toISOString()]);
    return defaults;
  }

  async updatePreferences(input: MobilePreferences): Promise<void> {
    await this.run(`UPDATE settings SET economy = ?, min_val_stat = ?, max_val_stat = ?, increment = ?, language = ?, theme = ?, updated_at = ? WHERE id = 1`, [input.economy, input.minValStat, input.maxValStat, input.increment, input.language, input.theme, new Date().toISOString()]);
  }

  async markCategorySynced(localId: string, remoteId: number): Promise<void> {
    await this.run(`UPDATE categories SET remote_id = ?, sync_state = 'synced' WHERE local_id = ?`, [remoteId, localId]);
    await this.run(`DELETE FROM sync_queue WHERE entity_type = 'category' AND entity_local_id = ?`, [localId]);
    await this.run(`DELETE FROM categories WHERE local_id = ? AND deleted_at IS NOT NULL`, [localId]);
  }

  async markTransactionSynced(localId: string, remoteId: number): Promise<void> {
    await this.run(`UPDATE transactions SET remote_id = ?, sync_state = 'synced' WHERE local_id = ?`, [remoteId, localId]);
    await this.run(`DELETE FROM sync_queue WHERE entity_type = 'transaction' AND entity_local_id = ?`, [localId]);
    await this.run(`DELETE FROM transactions WHERE local_id = ? AND deleted_at IS NOT NULL`, [localId]);
  }

  async listUnsyncedCategories(): Promise<LocalCategory[]> {
    const rows = await this.query<CategoryRow>(`SELECT * FROM categories WHERE deleted_at IS NULL AND remote_id IS NULL ORDER BY created_at ASC`);
    return rows.map(categoryFromRow);
  }

  async listUnsyncedTransactions(): Promise<Array<LocalTransaction & { categoryRemoteId: number | null }>> {
    const rows = await this.query<TransactionRow & { category_remote_id: number | null }>(`
      SELECT t.*, c.remote_id AS category_remote_id, NULL AS category_name, NULL AS category_color, NULL AS category_icon
      FROM transactions t LEFT JOIN categories c ON c.local_id = t.category_local_id
      WHERE t.deleted_at IS NULL AND t.remote_id IS NULL ORDER BY t.created_at ASC`);
    return rows.map((row) => ({ ...transactionFromRow(row), categoryRemoteId: row.category_remote_id }));
  }

  async categorySyncChanges(): Promise<Array<LocalCategory & { operation: SyncAction }>> {
    const rows = await this.query<CategoryRow & { operation: SyncAction }>(`SELECT c.*, q.action AS operation FROM sync_queue q JOIN categories c ON c.local_id = q.entity_local_id WHERE q.entity_type = 'category' ORDER BY q.created_at`);
    return rows.map((row) => ({ ...categoryFromRow(row), operation: row.operation }));
  }

  async transactionSyncChanges(): Promise<Array<LocalTransaction & { operation: SyncAction; categoryRemoteId: number | null }>> {
    const rows = await this.query<TransactionRow & { operation: SyncAction; category_remote_id: number | null }>(`SELECT t.*, q.action AS operation, c.remote_id AS category_remote_id, NULL AS category_name, NULL AS category_color, NULL AS category_icon FROM sync_queue q JOIN transactions t ON t.local_id = q.entity_local_id LEFT JOIN categories c ON c.local_id = t.category_local_id WHERE q.entity_type = 'transaction' ORDER BY q.created_at`);
    return rows.map((row) => ({ ...transactionFromRow(row), operation: row.operation, categoryRemoteId: row.category_remote_id }));
  }

  async applyServerSnapshot(snapshot: ServerSnapshot): Promise<void> {
    for (const category of snapshot.categories) {
      const localId = category.client_id || `server-category-${category.id}`;
      const existing = await this.query<CategoryRow>(`SELECT * FROM categories WHERE local_id = ? OR remote_id = ? LIMIT 1`, [localId, category.id]);
      if (existing[0]?.sync_state === 'pending') continue;
      await this.run(`INSERT INTO categories (local_id, remote_id, name, color, icon, type, budget_amount, created_at, updated_at, deleted_at, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'synced') ON CONFLICT(local_id) DO UPDATE SET remote_id=excluded.remote_id, name=excluded.name, color=excluded.color, type=excluded.type, budget_amount=excluded.budget_amount, updated_at=excluded.updated_at, deleted_at=NULL, sync_state='synced'`, [existing[0]?.local_id ?? localId, category.id, category.name, category.color, existing[0]?.icon ?? DEFAULT_CATEGORY_ICON, category.type, category.budget_amount, category.created_at ?? category.updated_at, category.updated_at]);
    }
    for (const transaction of snapshot.transactions) {
      const localId = transaction.client_id || `server-transaction-${transaction.id}`;
      const category = await this.query<{ local_id: string }>(`SELECT local_id FROM categories WHERE remote_id = ? LIMIT 1`, [transaction.category_id]);
      if (!category[0]) continue;
      const existing = await this.query<TransactionRow>(`SELECT t.*, NULL AS category_name, NULL AS category_color, NULL AS category_icon FROM transactions t WHERE local_id = ? OR remote_id = ? LIMIT 1`, [localId, transaction.id]);
      if (existing[0]?.sync_state === 'pending') continue;
      await this.run(`INSERT INTO transactions (local_id, remote_id, amount, occurred_at, is_income, reason, category_local_id, created_at, updated_at, deleted_at, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'synced') ON CONFLICT(local_id) DO UPDATE SET remote_id=excluded.remote_id, amount=excluded.amount, occurred_at=excluded.occurred_at, is_income=excluded.is_income, reason=excluded.reason, category_local_id=excluded.category_local_id, updated_at=excluded.updated_at, deleted_at=NULL, sync_state='synced'`, [existing[0]?.local_id ?? localId, transaction.id, transaction.amount, transaction.date, transaction.is_in ? 1 : 0, transaction.reason ?? '', category[0].local_id, transaction.created_at ?? transaction.updated_at, transaction.updated_at]);
    }
  }

  private async ensureCategoryIconColumn(): Promise<void> {
    if (!this.connection) throw new Error('La base locale n’est pas initialisée.');
    const result = await this.connection.query('PRAGMA table_info(categories)');
    const columns = (result.values ?? []) as Array<{ name?: string }>;
    if (!columns.some((column) => column.name === 'icon')) {
      await this.connection.run(`ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT '${DEFAULT_CATEGORY_ICON}'`);
    }
  }

  private async enqueue(entityType: 'transaction' | 'category' | 'settings', entityLocalId: string, action: SyncAction, payload: unknown): Promise<void> {
    await this.run(
      `INSERT INTO sync_queue (id, entity_type, entity_local_id, action, payload, created_at, attempts, last_error)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL)`,
      [crypto.randomUUID(), entityType, entityLocalId, action, JSON.stringify(payload), new Date().toISOString()],
    );
  }

  private async replaceQueuedChange(entityType: 'transaction' | 'category', entityLocalId: string, action: SyncAction): Promise<void> {
    await this.run(`DELETE FROM sync_queue WHERE entity_type = ? AND entity_local_id = ?`, [entityType, entityLocalId]);
    const table = entityType === 'transaction' ? 'transactions' : 'categories';
    const rows = await this.query<{ remote_id: number | null }>(`SELECT remote_id FROM ${table} WHERE local_id = ?`, [entityLocalId]);
    await this.enqueue(entityType, entityLocalId, rows[0]?.remote_id ? action : 'create', {});
  }

  private async query<T>(statement: string, values: unknown[] = []): Promise<T[]> {
    await this.initialize();
    if (!this.connection) throw new Error('La base locale n’est pas initialisée.');
    const response = await this.connection.query(statement, values);
    return (response.values ?? []) as T[];
  }

  private async run(statement: string, values: unknown[] = []): Promise<void> {
    await this.initialize();
    if (!this.connection) throw new Error('La base locale n’est pas initialisée.');
    await this.connection.run(statement, values);
  }
}

interface CategoryRow {
  local_id: string; remote_id: number | null; name: string; color: string; icon: string; type: 'income' | 'outcome'; budget_amount: number | null;
  created_at: string; updated_at: string; deleted_at: string | null; sync_state: LocalCategory['syncState'];
}

interface TransactionRow {
  local_id: string; remote_id: number | null; amount: number; occurred_at: string; is_income: number; reason: string; category_local_id: string | null;
  created_at: string; updated_at: string; deleted_at: string | null; sync_state: LocalTransaction['syncState']; category_name: string | null; category_color: string | null; category_icon: string | null;
}

export interface ServerSnapshot {
  categories: Array<{ id: number; client_id: string | null; name: string; color: string; type: 'income' | 'outcome'; budget_amount: number | null; created_at?: string; updated_at: string }>;
  transactions: Array<{ id: number; client_id: string | null; amount: number; is_in: boolean; date: string; reason: string | null; category_id: number; created_at?: string; updated_at: string }>;
}

export interface MobilePreferences {
  economy: number;
  minValStat: number;
  maxValStat: number;
  increment: number;
  language: 'fr' | 'en' | 'mg';
  theme: 'dark' | 'light' | 'system';
}

const categoryFromRow = (row: CategoryRow): LocalCategory => ({
  localId: row.local_id, remoteId: row.remote_id, name: row.name, color: row.color, icon: row.icon || DEFAULT_CATEGORY_ICON, type: row.type, budgetAmount: row.budget_amount,
  createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at, syncState: row.sync_state,
});

const transactionFromRow = (row: TransactionRow): LocalTransaction & { categoryName: string | null; categoryColor: string | null; categoryIcon: string | null } => ({
  localId: row.local_id, remoteId: row.remote_id, amount: Number(row.amount), occurredAt: row.occurred_at, isIncome: Boolean(row.is_income), reason: row.reason,
  categoryLocalId: row.category_local_id, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at, syncState: row.sync_state,
  categoryName: row.category_name, categoryColor: row.category_color, categoryIcon: row.category_icon,
});

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS local_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    remote_user_id INTEGER,
    username TEXT,
    sync_cursor TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    local_id TEXT PRIMARY KEY,
    remote_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    type TEXT NOT NULL CHECK (type IN ('income', 'outcome')),
    budget_amount REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_state TEXT NOT NULL CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    local_id TEXT PRIMARY KEY,
    remote_id INTEGER UNIQUE,
    amount REAL NOT NULL CHECK (amount > 0),
    occurred_at TEXT NOT NULL,
    is_income INTEGER NOT NULL CHECK (is_income IN (0, 1)),
    reason TEXT NOT NULL DEFAULT '',
    category_local_id TEXT REFERENCES categories(local_id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_state TEXT NOT NULL CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    economy REAL NOT NULL DEFAULT 0,
    min_val_stat REAL NOT NULL DEFAULT 0,
    max_val_stat REAL NOT NULL DEFAULT 0,
    increment REAL NOT NULL DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'fr',
    theme TEXT NOT NULL DEFAULT 'system',
    updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL DEFAULT 'local' CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict'))
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('transaction', 'category', 'settings')),
    entity_local_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_local_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
`;
