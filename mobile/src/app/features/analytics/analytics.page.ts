import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonLabel, IonModal, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { LocalDatabaseService } from '../../core/data/local-database.service';
import { ReportCategoryTotal, ReportData, ReportPeriod, ReportTransaction, createReportData, createReportRange } from '../../core/reports/report-data';
import { FeedbackToastService } from '../../core/services/feedback-toast.service';
import { ReportExportFormat, ReportExportService } from '../../core/services/report-export.service';

type ViewPeriod = Exclude<ReportPeriod, 'custom'>;

interface ExportFormatOption {
  description: string;
  icon: string;
  label: string;
  value: ReportExportFormat;
}

interface ExportPeriodOption {
  description: string;
  value: ReportPeriod;
}

@Component({
  selector: 'app-analytics',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonModal],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">Rapports</span></span>
          </div>
        </ion-title>
        <button slot="end" type="button" class="header-action" aria-label="Retour au profil" (click)="goProfile()"><i class="pi pi-arrow-left"></i></button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="report-page page-shell">
        <section class="report-top-controls">
          <ion-segment class="report-period kv-choice-segment" [value]="period()" (ionChange)="setPeriod($event.detail.value)" aria-label="Période de l’aperçu">
            <ion-segment-button value="week"><ion-label>Semaine</ion-label></ion-segment-button>
            <ion-segment-button value="month"><ion-label>Ce mois</ion-label></ion-segment-button>
            <ion-segment-button value="year"><ion-label>Année</ion-label></ion-segment-button>
          </ion-segment>
          <button type="button" class="report-export-icon" aria-label="Exporter le rapport" [disabled]="!transactions().length" (click)="openExport()"><i class="pi pi-download"></i></button>
        </section>

        @if (!visibleTransactions().length) {
          <section class="report-empty">
            <span><i class="pi pi-chart-bar"></i></span>
            <h1>Vos rapports prendront vie ici</h1>
            <p>Ajoutez une transaction pour visualiser la répartition de vos revenus et dépenses.</p>
          </section>
        } @else {
          <section class="report-result">
            <span class="report-period-chip"><i class="pi pi-calendar"></i> {{ periodLabel() }}</span>
            <p>Résultat net</p>
            <strong [class.expense]="availableBalance() < 0">{{ signedMGA(availableBalance()) }}</strong>
            <div class="report-kpis">
              <article><i class="pi pi-arrow-down-left"></i><span>Revenus</span><b class="income">+ {{ mga(summary().income) }}</b></article>
              <article><i class="pi pi-arrow-up-right"></i><span>Dépenses</span><b class="expense">− {{ mga(summary().expenses) }}</b></article>
            </div>
          </section>

          @if (categories().length) {
            <section class="report-card">
              <div class="report-heading"><h1>Dépenses par catégorie</h1><span>{{ periodLabel() }}</span></div>
              <p class="report-subtitle">Total : {{ mga(summary().expenses) }}</p>
              <div class="report-category-list">
                @for (category of categories(); track category.name + category.amount) {
                  <article>
                    <div><b>{{ category.name }}</b><span>{{ mga(category.amount) }} · {{ category.percent }} % des dépenses</span></div>
                    <div class="report-bar" [attr.aria-label]="category.name + ', ' + category.percent + ' pour cent des dépenses'"><i [style.width.%]="barWidth(category)" [style.background]="category.color"></i></div>
                  </article>
                }
              </div>
            </section>
          }

          @if (largestCategory(); as largest) {
            <section class="report-insight">
              <i class="pi pi-lightbulb"></i>
              <div><span>Analyse de votre période</span><p><b>{{ largest.name }}</b> représente {{ largest.percent }} % de vos dépenses. {{ budgetSentence() }}</p></div>
            </section>
          }
        }

        <button type="button" class="report-export-cta" [disabled]="!transactions().length" (click)="openExport()">
          <i class="pi pi-download"></i>
          {{ transactions().length ? 'Exporter le rapport' : 'Aucune donnée à exporter' }}
        </button>
      </main>
    </ion-content>

    <ion-modal class="export-modal" [isOpen]="exportOpen()" [breakpoints]="[0, 1]" [initialBreakpoint]="1" [backdropDismiss]="!exporting()" [canDismiss]="!exporting()" (didDismiss)="closeExport()">
      <ng-template>
        <section class="export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title">
          <span class="export-sheet__handle" aria-hidden="true"></span>
          <header class="export-sheet__header">
            <div><p>RAPPORT KAJY VOLA</p><h1 id="export-title">Exporter le rapport</h1></div>
            <button type="button" aria-label="Fermer" [disabled]="exporting()" (click)="closeExport()"><i class="pi pi-times"></i></button>
          </header>

          <div class="export-sheet__body">
          <section class="export-section">
            <div class="export-section__heading"><span>1</span><div><h2>Format du fichier</h2><p>Choisissez le format le plus pratique pour vous.</p></div></div>
            <div class="export-format-grid" role="radiogroup" aria-label="Format d’export">
              @for (format of exportFormats; track format.value) {
                <button type="button" role="radio" [attr.aria-checked]="exportFormat() === format.value" [class.selected]="exportFormat() === format.value" (click)="exportFormat.set(format.value)">
                  <i [class]="format.icon"></i><b>{{ format.label }}</b><small>{{ format.description }}</small>
                </button>
              }
            </div>
          </section>

          <section class="export-section">
            <div class="export-section__heading"><span>2</span><div><h2>Période à inclure</h2><p>Vous pouvez exporter une période différente de l’aperçu.</p></div></div>
            <div class="export-period-list" role="radiogroup" aria-label="Période d’export">
              @for (option of exportPeriods; track option.value) {
                <button type="button" role="radio" [attr.aria-checked]="exportPeriod() === option.value" [class.selected]="exportPeriod() === option.value" (click)="setExportPeriod(option.value)">
                  <span><b>{{ option.description }}</b><small>{{ option.value === 'custom' ? 'Choisir les dates' : periodDetail(option.value) }}</small></span><i class="pi pi-check"></i>
                </button>
              }
            </div>

            @if (exportPeriod() === 'custom') {
              <div class="export-date-range">
                <label><span>Du</span><input type="date" [value]="customStart()" [max]="customEnd() || null" (input)="customStart.set($any($event.target).value)"></label>
                <label><span>Au</span><input type="date" [value]="customEnd()" [min]="customStart() || null" (input)="customEnd.set($any($event.target).value)"></label>
              </div>
            }
          </section>

          @if (exportRangeError()) {
            <p class="export-validation"><i class="pi pi-exclamation-circle"></i>{{ exportRangeError() }}</p>
          } @else {
            <p class="export-preview"><i class="pi pi-calendar"></i>{{ exportPreview() }}</p>
          }
          </div>

          <footer class="export-actions">
            <button type="button" class="export-cancel" [disabled]="exporting()" (click)="closeExport()">Annuler</button>
            <button type="button" class="export-submit" [disabled]="!canExport()" (click)="exportReport()"><i class="pi" [class.pi-spin]="exporting()" [class.pi-spinner]="exporting()" [class.pi-download]="!exporting()"></i>{{ exporting() ? 'Préparation…' : 'Exporter en ' + exportFormatLabel() }}</button>
          </footer>
        </section>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .report-page { display:grid; gap:1rem; padding-top:1rem; }
    .report-top-controls { align-items:center; display:grid; gap:.65rem; grid-template-columns:minmax(0,1fr) auto; }.report-period { margin:0; }.report-export-icon { align-items:center; background:#fff; border:1px solid #dbe7fb; border-radius:.84rem; box-shadow:0 5px 14px rgb(38 74 142 / .07); color:#0968d8; display:inline-flex; font-size:1rem; height:2.85rem; justify-content:center; padding:0; width:2.85rem; }.report-export-icon:disabled { opacity:.45; }
    .report-card,.report-empty { background:#fff; border:1px solid #e3eafd; border-radius:1rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); }
    .report-result { background:radial-gradient(circle at 87% 31%, rgb(121 194 255 / .62), transparent 22%), linear-gradient(135deg, #0873e9 0%, #197ff0 55%, #1168ce 100%); border:0; border-radius:1rem; box-shadow:0 15px 27px -14px rgb(14 104 218 / .62); color:#fff; display:grid; gap:.55rem; overflow:hidden; padding:1.1rem; position:relative; }.report-result::after { border:1px solid rgb(255 255 255 / .15); border-radius:50%; content:''; height:11rem; pointer-events:none; position:absolute; right:-5.8rem; top:-4.6rem; width:11rem; }.report-result > * { position:relative; z-index:1; }.report-result > p { color:rgb(255 255 255 / .78); font-size:.76rem; margin:.2rem 0 0; }.report-result > strong { color:#fff; font-size:2rem; letter-spacing:-.055em; line-height:1; }.report-result > strong.expense { color:#fff !important; }
    .report-period-chip { align-items:center; background:rgb(1 72 164 / .2); border-radius:999px; color:rgb(255 255 255 / .92); display:inline-flex; font-size:.68rem; font-weight:800; gap:.35rem; justify-self:start; padding:.34rem .6rem; }.report-kpis { display:grid; gap:.65rem; grid-template-columns:1fr 1fr; margin-top:.35rem; }.report-kpis article { background:rgb(255 255 255 / .15); border:1px solid rgb(255 255 255 / .13); border-radius:.8rem; color:#fff; display:grid; gap:.2rem; padding:.7rem; }.report-kpis i { align-items:center; background:rgb(255 255 255 / .92); border-radius:50%; color:#0968d8; display:flex; font-size:.72rem; height:1.55rem; justify-content:center; width:1.55rem; }.report-kpis article:first-child i { color:#007e70; }.report-kpis article:last-child i { color:#c81e2a; }.report-kpis span { color:rgb(255 255 255 / .82); font-size:.68rem; }.report-kpis b,.report-kpis b.income,.report-kpis b.expense { color:#fff !important; font-size:.82rem; letter-spacing:-.025em; white-space:nowrap; }
    .report-card { display:grid; gap:.8rem; padding:1rem; }.report-heading { align-items:baseline; display:flex; gap:.75rem; justify-content:space-between; }.report-heading h1 { font-size:1.08rem; margin:0; }.report-heading span,.report-subtitle { color:#64718a; font-size:.7rem; margin:0; }.report-category-list { display:grid; gap:.92rem; }.report-category-list article { display:grid; gap:.4rem; }.report-category-list article > div:first-child { display:grid; gap:.16rem; }.report-category-list b { color:#10213f; font-size:.81rem; }.report-category-list span { color:#64718a; font-size:.69rem; }.report-bar { background:#e6edfc; border-radius:999px; height:.47rem; overflow:hidden; }.report-bar i { border-radius:inherit; display:block; height:100%; min-width:.45rem; }
    .report-insight { align-items:flex-start; background:#e8f1ff; border:1px solid #d6e5ff; border-radius:1rem; display:flex; gap:.7rem; padding:1rem; }.report-insight > i { align-items:center; background:#0968d8; border-radius:50%; color:#fff; display:flex; flex:0 0 auto; height:2.2rem; justify-content:center; width:2.2rem; }.report-insight span { color:#0968d8; font-size:.68rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; }.report-insight p { color:#344461; font-size:.78rem; line-height:1.45; margin:.22rem 0 0; }
    .report-empty { align-items:center; display:grid; justify-items:center; min-height:22rem; padding:2rem 1.25rem; text-align:center; }.report-empty span { align-items:center; background:#e8f1ff; border-radius:50%; color:#0968d8; display:flex; font-size:1.5rem; height:4rem; justify-content:center; width:4rem; }.report-empty h1 { font-size:1.2rem; margin:1rem 0 .35rem; }.report-empty p { color:#64718a; font-size:.82rem; line-height:1.45; margin:0; }
    .report-export-cta { align-items:center; background:#0968d8; border:0; border-radius:999px; box-shadow:0 10px 22px rgb(9 104 216 / .25); color:#fff; display:flex; font-size:.86rem; font-weight:800; gap:.55rem; justify-content:center; min-height:3.2rem; padding:.75rem 1rem; width:100%; }.report-export-cta:disabled { background:#b8c6dd; box-shadow:none; }
    .export-sheet { background:#fff; display:grid; gap:1.1rem; max-height:90dvh; overflow:auto; padding:0 1rem calc(1rem + env(safe-area-inset-bottom)); }.export-sheet__handle { background:#dce6f7; border-radius:999px; height:.28rem; justify-self:center; margin:.65rem 0 -.45rem; width:2.4rem; }.export-sheet__header { align-items:flex-start; display:flex; gap:1rem; justify-content:space-between; }.export-sheet__header p { color:#0968d8; font-size:.65rem; font-weight:850; letter-spacing:.1em; margin:0 0 .18rem; text-transform:uppercase; }.export-sheet__header h1 { color:#10213f; font-size:1.3rem; letter-spacing:-.04em; margin:0; }.export-sheet__header button { align-items:center; background:#eff4ff; border:0; border-radius:50%; color:#0968d8; display:inline-flex; flex:0 0 auto; height:2.35rem; justify-content:center; width:2.35rem; }.export-section { display:grid; gap:.72rem; }.export-section__heading { align-items:flex-start; display:flex; gap:.6rem; }.export-section__heading > span { align-items:center; background:#e8f1ff; border-radius:50%; color:#0968d8; display:flex; flex:0 0 auto; font-size:.68rem; font-weight:850; height:1.5rem; justify-content:center; width:1.5rem; }.export-section__heading h2 { color:#10213f; font-size:.88rem; margin:0 0 .12rem; }.export-section__heading p { color:#64718a; font-size:.7rem; line-height:1.35; margin:0; }
    .export-format-grid { display:grid; gap:.55rem; grid-template-columns:repeat(4,minmax(0,1fr)); }.export-format-grid button { background:#fff; border:1px solid #dfe8f8; border-radius:.8rem; color:#69778c; display:grid; font-size:1.1rem; gap:.23rem; justify-items:center; min-height:5.2rem; padding:.55rem .15rem; text-align:center; }.export-format-grid button b { color:#253750; font-size:.71rem; }.export-format-grid button small { color:#7b8799; font-size:.53rem; line-height:1.15; }.export-format-grid button.selected { background:#edf4ff; border-color:#0968d8; box-shadow:0 0 0 2px rgb(9 104 216 / .1); color:#0968d8; }.export-format-grid button.selected b { color:#0968d8; }
    .export-period-list { display:grid; gap:.48rem; grid-template-columns:1fr 1fr; }.export-period-list button { align-items:center; background:#fff; border:1px solid #dfe8f8; border-radius:.78rem; color:#10213f; display:flex; gap:.4rem; justify-content:space-between; min-height:3.5rem; padding:.58rem .65rem; text-align:left; }.export-period-list button > span { display:grid; gap:.1rem; min-width:0; }.export-period-list b { font-size:.72rem; }.export-period-list small { color:#75839a; font-size:.6rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.export-period-list button > i { align-items:center; background:#d9e6fb; border-radius:50%; color:transparent; display:flex; font-size:.6rem; height:1.25rem; justify-content:center; width:1.25rem; }.export-period-list button.selected { background:#f1f6ff; border-color:#0968d8; }.export-period-list button.selected > i { background:#0968d8; color:#fff; }
    .export-date-range { background:#f6f9ff; border:1px solid #e1eafa; border-radius:.82rem; display:grid; gap:.55rem; grid-template-columns:1fr 1fr; padding:.7rem; }.export-date-range label { display:grid; gap:.28rem; }.export-date-range label > span { color:#64718a; font-size:.64rem; font-weight:750; }.export-date-range input { background:#fff; border:1px solid #d7e3f7; border-radius:.6rem; color:#10213f; font:inherit; font-size:.72rem; min-width:0; outline:0; padding:.58rem .45rem; }.export-date-range input:focus { border-color:#0968d8; box-shadow:0 0 0 3px rgb(9 104 216 / .1); }
    .export-preview,.export-validation { align-items:center; border-radius:.75rem; display:flex; font-size:.72rem; gap:.48rem; line-height:1.35; margin:0; padding:.7rem .75rem; }.export-preview { background:#eff8f5; color:#007e70; }.export-validation { background:#fff2f3; color:#b82734; }.export-actions { background:#fff; bottom:0; display:grid; gap:.65rem; grid-template-columns:auto minmax(0,1fr); margin-bottom:-1rem; padding:.8rem 0 calc(1rem + env(safe-area-inset-bottom)); position:sticky; z-index:1; }.export-actions button { border-radius:.82rem; font-size:.78rem; font-weight:800; min-height:3rem; padding:0 .95rem; }.export-cancel { background:#fff; border:1px solid #cfdbef; color:#56647b; }.export-submit { background:#0968d8; border:0; box-shadow:0 8px 18px -10px rgb(9 104 216 / .75); color:#fff; }.export-submit:disabled,.export-cancel:disabled { opacity:.55; }.export-submit i { margin-right:.35rem; }
    .export-sheet { gap:0; grid-template-rows:auto auto minmax(0,1fr) auto; height:100%; max-height:none; min-height:0; overflow:hidden; padding:0; }.export-sheet__handle { margin:.65rem 0 .25rem; }.export-sheet__header { padding:.3rem 1rem .85rem; }.export-sheet__body { align-content:start; display:grid; gap:1.1rem; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 1rem 1rem; scrollbar-width:none; touch-action:pan-y; }.export-sheet__body::-webkit-scrollbar { display:none; }.export-period-list button > i { aspect-ratio:1 / 1; box-sizing:border-box; flex:0 0 1.25rem; min-height:1.25rem; min-width:1.25rem; }.export-actions { border-top:1px solid #e6edf8; bottom:auto; box-shadow:0 -0.55rem 1rem rgb(28 55 104 / .05); margin:0; padding:.75rem 1rem calc(.75rem + env(safe-area-inset-bottom)); position:relative; }
    @media (max-width:340px) { .report-top-controls { gap:.45rem; }.report-export-icon { height:2.65rem; width:2.65rem; }.export-format-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.export-period-list { grid-template-columns:1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {
  private readonly database = inject(LocalDatabaseService);
  private readonly feedbackToast = inject(FeedbackToastService);
  private readonly reportExporter = inject(ReportExportService);
  private readonly router = inject(Router);

  readonly transactions = signal<ReportTransaction[]>([]);
  readonly period = signal<ViewPeriod>('month');
  readonly exportOpen = signal(false);
  readonly exporting = signal(false);
  readonly exportFormat = signal<ReportExportFormat>('pdf');
  readonly exportPeriod = signal<ReportPeriod>('month');
  readonly customStart = signal('');
  readonly customEnd = signal('');
  readonly monthStartDay = signal(1);
  readonly economy = signal(10);

  readonly currentReport = computed(() => createReportData(this.transactions(), this.reportRange(this.period())));
  readonly visibleTransactions = computed(() => this.currentReport().transactions);
  readonly summary = computed(() => this.currentReport().summary);
  readonly availableBalance = computed(() => this.summary().income * (100 - this.economy()) / 100 - this.summary().expenses);
  readonly categories = computed<ReportCategoryTotal[]>(() => this.currentReport().categories.slice(0, 6));
  readonly largestCategory = computed(() => this.categories()[0] ?? null);
  readonly exportRangeError = computed(() => {
    try { this.rangeForExport(); return ''; }
    catch (error) { return error instanceof Error ? error.message : 'Choisissez une période valide.'; }
  });
  readonly exportReportData = computed<ReportData | null>(() => {
    try { return createReportData(this.transactions(), this.rangeForExport()); }
    catch { return null; }
  });
  readonly exportPreview = computed(() => {
    const report = this.exportReportData();
    if (!report) return '';
    const count = report.transactions.length;
    return `${report.range.rangeLabel} · ${count} transaction${count > 1 ? 's' : ''} incluse${count > 1 ? 's' : ''}`;
  });
  readonly canExport = computed(() => Boolean(this.exportReportData()?.transactions.length) && !this.exporting());

  readonly exportFormats: readonly ExportFormatOption[] = [
    { value: 'pdf', label: 'PDF', description: 'Prêt à partager', icon: 'pi pi-file-pdf' },
    { value: 'csv', label: 'CSV', description: 'Données brutes', icon: 'pi pi-file' },
    { value: 'excel', label: 'Excel', description: 'Tableur', icon: 'pi pi-file-excel' },
    { value: 'docx', label: 'DOCX', description: 'Document', icon: 'pi pi-file-word' },
  ];
  readonly exportPeriods: readonly ExportPeriodOption[] = [
    { value: 'month', description: 'Ce mois' },
    { value: 'week', description: 'Cette semaine' },
    { value: 'year', description: 'Cette année' },
    { value: 'custom', description: 'Plage personnalisée' },
  ];

  ionViewWillEnter(): void { void this.load(); }

  setPeriod(value: unknown): void {
    if (value === 'week' || value === 'month' || value === 'year') this.period.set(value);
  }

  goProfile(): void { void this.router.navigateByUrl('/tabs/profile'); }

  openExport(): void {
    if (!this.transactions().length) return;
    const range = this.reportRange(this.period());
    this.exportPeriod.set(this.period());
    this.customStart.set(range.startKey);
    this.customEnd.set(range.endKey);
    this.exportOpen.set(true);
  }

  closeExport(): void {
    if (!this.exporting()) this.exportOpen.set(false);
  }

  setExportPeriod(value: ReportPeriod): void { this.exportPeriod.set(value); }
  periodLabel(): string { return this.currentReport().range.label; }
  periodDetail(period: Exclude<ReportPeriod, 'custom'>): string { return this.reportRange(period).rangeLabel; }
  exportFormatLabel(): string { return this.exportFormats.find((format) => format.value === this.exportFormat())?.label ?? 'PDF'; }
  amount(value: number): string { return new Intl.NumberFormat('fr-FR').format(Math.abs(value)); }
  mga(value: number): string { return this.amount(value) + ' MGA'; }
  signedMGA(value: number): string { return (value > 0 ? '+' : value < 0 ? '−' : '') + ' ' + this.mga(value); }
  barWidth(category: ReportCategoryTotal): number { return Math.max(5, category.percent); }
  budgetSentence(): string { return this.availableBalance() >= 0 ? 'Votre solde disponible reste positif sur cette période.' : 'Vos dépenses dépassent le revenu disponible après épargne.'; }

  async exportReport(): Promise<void> {
    const report = this.exportReportData();
    if (!report || !report.transactions.length || this.exporting()) return;
    const format = this.exportFormat();
    this.exporting.set(true);
    try {
      await this.reportExporter.export(format, report);
      this.exportOpen.set(false);
      await this.feedbackToast.show('export', `Rapport ${this.formatLabel(format)} prêt à partager.`);
    } catch {
      await this.feedbackToast.show('error', 'Impossible de préparer ce rapport. Réessayez dans un instant.');
    } finally {
      this.exporting.set(false);
    }
  }

  private async load(): Promise<void> {
    const [transactions, preferences] = await Promise.all([this.database.listTransactions(), this.database.getPreferences()]);
    this.transactions.set(transactions);
    this.monthStartDay.set(preferences.monthStartDay);
    this.economy.set(preferences.economy);
  }

  private rangeForExport() {
    const period = this.exportPeriod();
    if (period === 'custom') return createReportRange('custom', { start: this.customStart(), end: this.customEnd() });
    return this.reportRange(period);
  }

  private reportRange(period: Exclude<ReportPeriod, 'custom'>) {
    return createReportRange(period, undefined, new Date(), this.monthStartDay());
  }

  private formatLabel(format: ReportExportFormat): string { return this.exportFormats.find((item) => item.value === format)?.label ?? 'PDF'; }
}
