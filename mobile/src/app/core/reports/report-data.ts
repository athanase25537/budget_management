import { LocalTransaction } from '../models/offline.models';

export type ReportPeriod = 'week' | 'month' | 'year' | 'custom';

export type ReportTransaction = LocalTransaction & {
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
};

export interface ReportRange {
  endExclusiveKey: string;
  endKey: string;
  kind: ReportPeriod;
  label: string;
  rangeLabel: string;
  startKey: string;
}

export interface ReportSummary {
  balance: number;
  expenses: number;
  income: number;
}

export interface ReportCategoryTotal {
  amount: number;
  color: string;
  name: string;
  percent: number;
}

export interface ReportData {
  categories: ReportCategoryTotal[];
  generatedAt: Date;
  range: ReportRange;
  summary: ReportSummary;
  transactions: ReportTransaction[];
}

export interface CustomReportRangeInput {
  end: string;
  start: string;
}

const FALLBACK_COLORS = ['#b67600', '#0878dd', '#008573', '#4a5568', '#8e4ec6'];

export function createReportRange(period: ReportPeriod, customRange?: CustomReportRangeInput, referenceDate = new Date()): ReportRange {
  const reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  if (period === 'custom') {
    if (!customRange || !isValidDateKey(customRange.start) || !isValidDateKey(customRange.end) || customRange.start > customRange.end) {
      throw new Error('Choisissez une plage de dates valide.');
    }
    return range('custom', customRange.start, customRange.end, 'Plage personnalisée');
  }

  if (period === 'week') {
    const monday = new Date(reference);
    monday.setDate(reference.getDate() - ((reference.getDay() + 6) % 7));
    const sunday = addDays(monday, 6);
    return range('week', dateKey(monday), dateKey(sunday), 'Cette semaine');
  }

  if (period === 'year') {
    const start = new Date(reference.getFullYear(), 0, 1);
    const end = new Date(reference.getFullYear(), 11, 31);
    return range('year', dateKey(start), dateKey(end), String(reference.getFullYear()));
  }

  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return range('month', dateKey(start), dateKey(end), new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(start));
}

export function filterTransactionsForRange(transactions: ReportTransaction[], range: ReportRange): ReportTransaction[] {
  return transactions.filter((transaction) => {
    const key = transactionDateKey(transaction.occurredAt);
    return Boolean(key) && key >= range.startKey && key < range.endExclusiveKey;
  });
}

export function createReportData(transactions: ReportTransaction[], range: ReportRange, generatedAt = new Date()): ReportData {
  const values = filterTransactionsForRange(transactions, range);
  const income = values.filter((item) => item.isIncome).reduce((total, item) => total + item.amount, 0);
  const expenses = values.filter((item) => !item.isIncome).reduce((total, item) => total + item.amount, 0);
  return {
    range,
    generatedAt,
    transactions: values,
    summary: { income, expenses, balance: income - expenses },
    categories: expenseCategories(values, expenses),
  };
}

export function formatReportDate(dateKeyValue: string): string {
  const parsed = parseDateKey(dateKeyValue);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

function range(kind: ReportPeriod, startKey: string, endKey: string, label: string): ReportRange {
  return {
    kind,
    label,
    startKey,
    endKey,
    endExclusiveKey: dateKey(addDays(parseDateKey(endKey), 1)),
    rangeLabel: `Du ${formatReportDate(startKey)} au ${formatReportDate(endKey)}`,
  };
}

function expenseCategories(transactions: ReportTransaction[], totalExpenses: number): ReportCategoryTotal[] {
  const values = new Map<string, { amount: number; color: string; name: string }>();
  for (const transaction of transactions) {
    if (transaction.isIncome) continue;
    const key = transaction.categoryLocalId ?? '__uncategorized__';
    const previous = values.get(key) ?? {
      amount: 0,
      color: transaction.categoryColor || FALLBACK_COLORS[values.size % FALLBACK_COLORS.length],
      name: transaction.categoryName || 'Sans catégorie',
    };
    values.set(key, { ...previous, amount: previous.amount + transaction.amount });
  }
  return [...values.values()]
    .map((category) => ({ ...category, percent: totalExpenses ? Math.round((category.amount / totalExpenses) * 100) : 0 }))
    .sort((first, second) => second.amount - first.amount);
}

function transactionDateKey(value: string): string {
  const direct = value.slice(0, 10);
  return isValidDateKey(direct) ? direct : '';
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return dateKey(parseDateKey(value)) === value;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: Date, amount: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
