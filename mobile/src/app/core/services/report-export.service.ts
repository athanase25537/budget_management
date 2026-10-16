import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ReportData } from '../reports/report-data';

export type ReportExportFormat = 'pdf' | 'csv' | 'excel' | 'docx';

interface ReportFile {
  blob: Blob;
  filename: string;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable({ providedIn: 'root' })
export class ReportExportService {
  async export(format: ReportExportFormat, report: ReportData): Promise<string> {
    const file = await this.createFile(format, report);
    if (Capacitor.isNativePlatform()) await this.shareNative(file, report);
    else this.downloadOnWeb(file);
    return file.filename;
  }

  private async createFile(format: ReportExportFormat, report: ReportData): Promise<ReportFile> {
    const filename = `kajy-vola_${report.range.startKey}_${report.range.endKey}`;
    if (format === 'pdf') return { filename: `${filename}.pdf`, blob: await this.pdf(report) };
    if (format === 'csv') return { filename: `${filename}.csv`, blob: this.csv(report) };
    if (format === 'excel') return { filename: `${filename}.xlsx`, blob: await this.excel(report) };
    return { filename: `${filename}.docx`, blob: await this.docx(report) };
  }

  /**
   * CSV deliberately stays data-first. A visual report belongs in PDF/DOCX/XLSX;
   * this compact table imports cleanly into accounting and spreadsheet software.
   * UTF-16LE with a BOM is detected correctly by common Android readers that were
   * treating the former UTF-8 export as Windows-1252.
   */
  private csv(report: ReportData): Blob {
    const rows: Array<Array<string | number>> = [
      ['Date', 'Type', 'Catégorie', 'Note', 'Montant (MGA)'],
      ...report.transactions.map((transaction) => [
        transaction.occurredAt.slice(0, 10),
        transaction.isIncome ? 'Revenu' : 'Dépense',
        transaction.categoryName || 'Sans catégorie',
        transaction.reason || '',
        transaction.isIncome ? transaction.amount : -transaction.amount,
      ]),
    ];
    const content = rows.map((row) => row.map((value) => this.escapeCsv(value)).join(';')).join('\r\n');
    return this.utf16LeCsv(content);
  }

  /** Generates an actual Office Open XML workbook, rather than XML renamed as .xls. */
  private async excel(report: ReportData): Promise<Blob> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const now = report.generatedAt.toISOString();

    zip.file('[Content_Types].xml', this.xlsxContentTypes());
    zip.file('_rels/.rels', this.xlsxRootRelationships());
    zip.file('docProps/core.xml', this.xlsxCoreProperties(now));
    zip.file('docProps/app.xml', this.xlsxAppProperties());
    zip.file('xl/workbook.xml', this.xlsxWorkbook());
    zip.file('xl/_rels/workbook.xml.rels', this.xlsxWorkbookRelationships());
    zip.file('xl/styles.xml', this.xlsxStyles());
    zip.file('xl/worksheets/sheet1.xml', this.xlsxReportSheet(report));
    zip.file('xl/worksheets/sheet2.xml', this.xlsxCategorySheet(report));

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      mimeType: XLSX_MIME,
    });
  }

  private xlsxReportSheet(report: ReportData): string {
    const rows: string[] = [
      this.xlsxRow(1, [this.xlsxTextCell('A', 1, 'Rapport Kajy Vola', 1)], 30),
      this.xlsxRow(2, [this.xlsxTextCell('A', 2, report.range.label, 2)], 22),
      this.xlsxRow(3, [this.xlsxTextCell('A', 3, `${report.range.rangeLabel} · Généré le ${this.generatedAt(report)}`, 3)], 18),
      this.xlsxRow(4, []),
      this.xlsxRow(5, [
        this.xlsxTextCell('A', 5, 'REVENUS', 4), this.xlsxEmptyCell('B', 5, 4),
        this.xlsxTextCell('C', 5, 'DÉPENSES', 4), this.xlsxEmptyCell('D', 5, 4),
        this.xlsxTextCell('E', 5, 'SOLDE', 7),
      ]),
      this.xlsxRow(6, [
        this.xlsxNumberCell('A', 6, report.summary.income, 5), this.xlsxEmptyCell('B', 6, 5),
        this.xlsxNumberCell('C', 6, report.summary.expenses, 6), this.xlsxEmptyCell('D', 6, 6),
        this.xlsxNumberCell('E', 6, report.summary.balance, 8),
      ], 25),
      this.xlsxRow(7, []),
      this.xlsxRow(8, [this.xlsxTextCell('A', 8, 'Détail des transactions', 9)]),
      this.xlsxRow(9, [
        this.xlsxTextCell('A', 9, 'Date', 10),
        this.xlsxTextCell('B', 9, 'Type', 10),
        this.xlsxTextCell('C', 9, 'Catégorie', 10),
        this.xlsxTextCell('D', 9, 'Note', 10),
        this.xlsxTextCell('E', 9, 'Montant (MGA)', 10),
      ], 22),
    ];
    const merges = ['A1:E1', 'A2:E2', 'A3:E3', 'A5:B5', 'A6:B6', 'C5:D5', 'C6:D6'];
    let rowNumber = 10;

    if (!report.transactions.length) {
      rows.push(this.xlsxRow(rowNumber, [this.xlsxTextCell('A', rowNumber, 'Aucune transaction sur cette période.', 11)], 24));
      merges.push(`A${rowNumber}:E${rowNumber}`);
      rowNumber += 1;
    } else {
      for (const transaction of report.transactions) {
        const amount = transaction.isIncome ? transaction.amount : -transaction.amount;
        rows.push(this.xlsxRow(rowNumber, [
          this.xlsxTextCell('A', rowNumber, this.shortDate(transaction.occurredAt), 11),
          this.xlsxTextCell('B', rowNumber, transaction.isIncome ? 'Revenu' : 'Dépense', 11),
          this.xlsxTextCell('C', rowNumber, transaction.categoryName || 'Sans catégorie', 11),
          this.xlsxTextCell('D', rowNumber, transaction.reason || '—', 11),
          this.xlsxNumberCell('E', rowNumber, amount, transaction.isIncome ? 12 : 13),
        ], 22));
        rowNumber += 1;
      }
    }

    rows.push(this.xlsxRow(rowNumber, [
      this.xlsxTextCell('A', rowNumber, 'Solde net de la période', 14),
      this.xlsxEmptyCell('B', rowNumber, 14),
      this.xlsxEmptyCell('C', rowNumber, 14),
      this.xlsxEmptyCell('D', rowNumber, 14),
      this.xlsxNumberCell('E', rowNumber, report.summary.balance, 15),
    ], 24));
    merges.push(`A${rowNumber}:D${rowNumber}`);

    const lastDataRow = Math.max(10, rowNumber - 1);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="9" topLeftCell="A10" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A10" sqref="A10"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols><col min="1" max="1" width="17" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="3" width="24" customWidth="1"/><col min="4" max="4" width="33" customWidth="1"/><col min="5" max="5" width="19" customWidth="1"/></cols>
  <sheetData>${rows.join('')}</sheetData>
  <mergeCells count="${merges.length}">${merges.map((merge) => `<mergeCell ref="${merge}"/>`).join('')}</mergeCells>
  <autoFilter ref="A9:E${lastDataRow}"/>
  <pageMargins left="0.35" right="0.35" top="0.55" bottom="0.55" header="0.25" footer="0.25"/>
</worksheet>`;
  }

  private xlsxCategorySheet(report: ReportData): string {
    const rows: string[] = [
      this.xlsxRow(1, [this.xlsxTextCell('A', 1, 'Dépenses par catégorie', 1)], 30),
      this.xlsxRow(2, [this.xlsxTextCell('A', 2, `${report.range.label} · ${this.amount(report.summary.expenses)}`, 3)], 20),
      this.xlsxRow(3, []),
      this.xlsxRow(4, [
        this.xlsxTextCell('A', 4, 'Catégorie', 10),
        this.xlsxTextCell('B', 4, 'Montant (MGA)', 10),
        this.xlsxTextCell('C', 4, 'Part des dépenses', 10),
      ], 22),
    ];
    let rowNumber = 5;
    if (!report.categories.length) {
      rows.push(this.xlsxRow(rowNumber, [this.xlsxTextCell('A', rowNumber, 'Aucune dépense sur cette période.', 11)], 24));
    } else {
      for (const category of report.categories) {
        rows.push(this.xlsxRow(rowNumber, [
          this.xlsxTextCell('A', rowNumber, category.name, 11),
          this.xlsxNumberCell('B', rowNumber, category.amount, 16),
          this.xlsxTextCell('C', rowNumber, `${category.percent} %`, 11),
        ], 22));
        rowNumber += 1;
      }
    }
    const lastRow = Math.max(5, rowNumber - 1);
    const merges = report.categories.length ? ['A1:C1', 'A2:C2'] : ['A1:C1', 'A2:C2', 'A5:C5'];
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="22" customWidth="1"/></cols>
  <sheetData>${rows.join('')}</sheetData>
  <mergeCells count="${merges.length}">${merges.map((merge) => `<mergeCell ref="${merge}"/>`).join('')}</mergeCells>
  <autoFilter ref="A4:C${lastRow}"/>
  <pageMargins left="0.35" right="0.35" top="0.55" bottom="0.55" header="0.25" footer="0.25"/>
</worksheet>`;
  }

  private xlsxRow(index: number, cells: string[], height?: number): string {
    return `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ''}>${cells.join('')}</row>`;
  }

  private xlsxTextCell(column: string, row: number, value: string, style = 0): string {
    const text = this.escapeXml(this.safeSpreadsheetValue(this.normaliseText(value)));
    const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
    return `<c r="${column}${row}" s="${style}" t="inlineStr"><is><t${preserve}>${text}</t></is></c>`;
  }

  private xlsxNumberCell(column: string, row: number, value: number, style = 0): string {
    const numeric = Number.isFinite(value) ? Math.round(value) : 0;
    return `<c r="${column}${row}" s="${style}"><v>${numeric}</v></c>`;
  }

  private xlsxEmptyCell(column: string, row: number, style = 0): string {
    return `<c r="${column}${row}" s="${style}"/>`;
  }

  private xlsxContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
  }

  private xlsxRootRelationships(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  }

  private xlsxCoreProperties(createdAt: string): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Kajy Vola</dc:creator><dc:title>Rapport Kajy Vola</dc:title><dc:subject>Gestion de budget personnel</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`;
  }

  private xlsxAppProperties(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Kajy Vola</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>2</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="2" baseType="lpstr"><vt:lpstr>Rapport</vt:lpstr><vt:lpstr>Catégories</vt:lpstr></vt:vector></TitlesOfParts>
  <Company>Kajy Vola</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>1.0</AppVersion>
</Properties>`;
  }

  private xlsxWorkbook(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr date1904="0"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
  <sheets><sheet name="Rapport" sheetId="1" r:id="rId2"/><sheet name="Catégories" sheetId="2" r:id="rId3"/></sheets>
  <calcPr calcId="191029"/>
</workbook>`;
  }

  private xlsxWorkbookRelationships(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;
  }

  private xlsxStyles(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 &quot;MGA&quot;;-#,##0 &quot;MGA&quot;;-"/></numFmts>
  <fonts count="8">
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><sz val="10"/><color rgb="FF64748B"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="20"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="12"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FF047857"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFB42318"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF1D4ED8"/><name val="Arial"/><family val="2"/></font>
  </fonts>
  <fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="3"><border/><border><left style="thin"><color rgb="FFD9E2F0"/></left><right style="thin"><color rgb="FFD9E2F0"/></right><top style="thin"><color rgb="FFD9E2F0"/></top><bottom style="thin"><color rgb="FFD9E2F0"/></bottom></border><border><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="17">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="5" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="6" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="5" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="6" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  }

  private async pdf(report: ReportData): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ format: 'a4', unit: 'pt', putOnlyUsedFonts: true });
    document.setProperties({ author: 'Kajy Vola', subject: 'Rapport de budget personnel', title: `Rapport ${this.normaliseText(report.range.label)}` });

    const pageWidth = document.internal.pageSize.getWidth();
    const pageHeight = document.internal.pageSize.getHeight();
    const margin = 46;
    const contentWidth = pageWidth - margin * 2;
    const ink: [number, number, number] = [15, 23, 42];
    const muted: [number, number, number] = [100, 116, 139];
    const brand: [number, number, number] = [37, 99, 235];
    const blueSurface: [number, number, number] = [239, 246, 255];
    const line: [number, number, number] = [217, 226, 240];
    const green: [number, number, number] = [4, 120, 87];
    const red: [number, number, number] = [180, 35, 24];
    const usableBottom = pageHeight - 56;
    let y = 48;

    const setText = (size: number, color: [number, number, number] = ink, bold = false): void => {
      document.setFont('helvetica', bold ? 'bold' : 'normal');
      document.setFontSize(size);
      document.setTextColor(...color);
    };
    const text = (value: string): string => this.normaliseText(value);
    const shorten = (value: string, maxWidth: number): string => {
      const source = text(value);
      if (document.getTextWidth(source) <= maxWidth) return source;
      let trimmed = source;
      while (trimmed.length > 1 && document.getTextWidth(`${trimmed}…`) > maxWidth) trimmed = trimmed.slice(0, -1);
      return `${trimmed}…`;
    };
    const divider = (at: number): void => {
      document.setDrawColor(...line);
      document.setLineWidth(.65);
      document.line(margin, at, pageWidth - margin, at);
    };
    const drawTableHeader = (): void => {
      document.setFillColor(241, 245, 249);
      document.rect(margin, y, contentWidth, 25, 'F');
      setText(8, muted, true);
      const headers = [
        { label: 'DATE', x: margin + 11, align: 'left' as const },
        { label: 'TYPE', x: margin + 82, align: 'left' as const },
        { label: 'CATÉGORIE', x: margin + 149, align: 'left' as const },
        { label: 'NOTE', x: margin + 254, align: 'left' as const },
        { label: 'MONTANT (MGA)', x: pageWidth - margin - 10, align: 'right' as const },
      ];
      for (const header of headers) document.text(header.label, header.x, y + 16, { align: header.align });
      y += 25;
    };
    const startTransactionPage = (continuation = false): void => {
      if (continuation) {
        setText(12, ink, true);
        document.text('Détail des transactions', margin, y);
        y += 14;
      }
      drawTableHeader();
    };
    const newTablePage = (): void => {
      document.addPage();
      y = 54;
      startTransactionPage(true);
    };

    document.setFillColor(...brand);
    document.roundedRect(margin, y - 2, 31, 31, 7, 7, 'F');
    setText(14, [255, 255, 255], true);
    document.text('K', margin + 15.5, y + 19, { align: 'center' });
    setText(13, ink, true);
    document.text('Kajy Vola', margin + 43, y + 11);
    setText(8.5, muted);
    document.text('Gestion du budget personnel', margin + 43, y + 25);
    setText(8.5, muted);
    document.text('Généré le', pageWidth - margin, y + 10, { align: 'right' });
    setText(9, ink, true);
    document.text(this.generatedAt(report), pageWidth - margin, y + 24, { align: 'right' });
    y += 48;
    divider(y);
    y += 30;

    setText(8.5, brand, true);
    document.text('RAPPORT DE BUDGET', margin, y);
    y += 28;
    setText(28, ink, true);
    document.text(shorten(report.range.label, contentWidth), margin, y);
    y += 20;
    setText(10, muted);
    document.text(text(report.range.rangeLabel), margin, y);
    y += 28;

    const metricWidth = contentWidth / 3;
    const metricTop = y;
    document.setDrawColor(...line);
    document.setLineWidth(.7);
    document.roundedRect(margin, metricTop, contentWidth, 91, 9, 9, 'S');
    document.setFillColor(...blueSurface);
    document.rect(margin + metricWidth * 2, metricTop + .7, metricWidth - .7, 89.6, 'F');
    document.setDrawColor(...line);
    document.line(margin + metricWidth, metricTop, margin + metricWidth, metricTop + 91);
    document.line(margin + metricWidth * 2, metricTop, margin + metricWidth * 2, metricTop + 91);
    const metrics = [
      { label: 'REVENUS', amount: report.summary.income, color: green, prefix: '' },
      { label: 'DÉPENSES', amount: report.summary.expenses, color: red, prefix: '-' },
      { label: 'SOLDE DU MOIS', amount: report.summary.balance, color: ink, prefix: report.summary.balance > 0 ? '+' : '' },
    ];
    metrics.forEach((metric, index) => {
      const x = margin + metricWidth * index + 16;
      setText(8, muted, true);
      document.text(metric.label, x, metricTop + 23);
      setText(18, metric.color, true);
      document.text(`${metric.prefix}${this.number(metric.amount)}`, x, metricTop + 55);
      setText(8.5, muted);
      document.text('MGA', x, metricTop + 75);
    });
    y = metricTop + 116;

    const panelGap = 24;
    const panelWidth = (contentWidth - panelGap) / 2;
    const panelHeight = 148;
    const rightPanelX = margin + panelWidth + panelGap;
    document.setDrawColor(...line);
    document.roundedRect(margin, y, panelWidth, panelHeight, 8, 8, 'S');
    document.roundedRect(rightPanelX, y, panelWidth, panelHeight, 8, 8, 'S');
    setText(11, ink, true);
    document.text('Dépenses par catégorie', margin + 13, y + 22);
    const categories = report.categories.slice(0, 4);
    if (!categories.length) {
      setText(9, muted);
      document.text('Aucune dépense sur cette période.', margin + 13, y + 52);
    } else {
      categories.forEach((category, index) => {
        const itemY = y + 44 + index * 24;
        setText(8.5, ink, index === 0);
        document.text(shorten(category.name, panelWidth - 102), margin + 13, itemY);
        setText(8, muted);
        document.text(`${this.number(category.amount)} MGA · ${category.percent} %`, margin + panelWidth - 12, itemY, { align: 'right' });
        document.setFillColor(232, 237, 246);
        document.roundedRect(margin + 13, itemY + 7, panelWidth - 26, 4, 2, 2, 'F');
        document.setFillColor(...brand);
        document.roundedRect(margin + 13, itemY + 7, Math.max(5, (panelWidth - 26) * Math.min(category.percent, 100) / 100), 4, 2, 2, 'F');
      });
    }
    setText(11, ink, true);
    document.text('Revenus et dépenses', rightPanelX + 13, y + 22);
    const maxFlow = Math.max(report.summary.income, report.summary.expenses, 1);
    const flows = [
      { label: 'Revenus', amount: report.summary.income, color: green },
      { label: 'Dépenses', amount: report.summary.expenses, color: red },
    ];
    flows.forEach((flow, index) => {
      const itemY = y + 56 + index * 50;
      setText(9, ink, true);
      document.text(flow.label, rightPanelX + 13, itemY);
      document.text(`${this.number(flow.amount)} MGA`, rightPanelX + panelWidth - 12, itemY, { align: 'right' });
      document.setFillColor(232, 237, 246);
      document.roundedRect(rightPanelX + 13, itemY + 10, panelWidth - 26, 6, 3, 3, 'F');
      document.setFillColor(...flow.color);
      document.roundedRect(rightPanelX + 13, itemY + 10, Math.max(flow.amount ? 7 : 0, (panelWidth - 26) * flow.amount / maxFlow), 6, 3, 3, 'F');
    });
    y += panelHeight + 30;

    setText(13, ink, true);
    document.text('Détail des transactions', margin, y);
    setText(9, muted);
    document.text(`${report.transactions.length} opération${report.transactions.length > 1 ? 's' : ''}`, pageWidth - margin, y, { align: 'right' });
    y += 14;
    startTransactionPage();

    const rowHeight = 29;
    if (!report.transactions.length) {
      setText(9, muted);
      document.text('Aucune transaction sur cette période.', margin + 11, y + 19);
      y += rowHeight;
    } else {
      for (const transaction of report.transactions) {
        if (y + rowHeight > usableBottom) newTablePage();
        const amount = transaction.isIncome ? transaction.amount : -transaction.amount;
        const amountColor = transaction.isIncome ? green : red;
        setText(8.3, ink);
        document.text(shorten(this.shortDate(transaction.occurredAt), 61), margin + 11, y + 18);
        document.text(transaction.isIncome ? 'Revenu' : 'Dépense', margin + 82, y + 18);
        document.text(shorten(transaction.categoryName || 'Sans catégorie', 94), margin + 149, y + 18);
        setText(8.1, muted);
        document.text(shorten(transaction.reason || '—', 140), margin + 254, y + 18);
        setText(8.7, amountColor, true);
        document.text(`${transaction.isIncome ? '+' : '-'}${this.number(amount)}`, pageWidth - margin - 10, y + 18, { align: 'right' });
        document.setDrawColor(226, 232, 240);
        document.setLineWidth(.45);
        document.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
        y += rowHeight;
      }
    }

    if (y + 31 > usableBottom) newTablePage();
    document.setFillColor(...blueSurface);
    document.rect(margin, y, contentWidth, 28, 'F');
    setText(9, ink, true);
    document.text('Solde net de la période', margin + 11, y + 18);
    setText(10, report.summary.balance < 0 ? red : ink, true);
    document.text(this.signedAmount(report.summary.balance), pageWidth - margin - 10, y + 18, { align: 'right' });

    const pageCount = document.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      document.setPage(page);
      divider(pageHeight - 37);
      setText(8, muted);
      document.text(`Kajy Vola · Rapport ${text(report.range.label)}`, margin, pageHeight - 22);
      document.text(`Page ${page} / ${pageCount}`, pageWidth - margin, pageHeight - 22, { align: 'right' });
    }
    return new Blob([document.output('arraybuffer')], { type: 'application/pdf' });
  }

  private async docx(report: ReportData): Promise<Blob> {
    const {
      AlignmentType, BorderStyle, Document, Footer, Header, Packer, PageNumber, Paragraph,
      ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlignTable, WidthType,
    } = await import('docx');
    const border = { style: BorderStyle.SINGLE, size: 4, color: 'D9E2F0' } as const;
    const borders = { top: border, bottom: border, left: border, right: border };
    const run = (value: string, options: { bold?: boolean; color?: string; size?: number } = {}) => new TextRun({
      text: this.normaliseText(value),
      font: 'Arial',
      size: options.size ?? 20,
      bold: options.bold,
      color: options.color ?? '0F172A',
    });
    const cell = (
      value: string,
      width: number,
      options: { bold?: boolean; color?: string; fill?: string; right?: boolean; size?: number; span?: number } = {},
    ) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      columnSpan: options.span,
      margins: { top: 105, bottom: 105, left: 130, right: 130 },
      verticalAlign: VerticalAlignTable.CENTER,
      borders,
      shading: options.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: options.fill } : undefined,
      children: [new Paragraph({
        alignment: options.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [run(value, options)],
      })],
    });
    const metricCell = (label: string, value: number, color: string, fill: string) => new TableCell({
      width: { size: 3400, type: WidthType.DXA },
      margins: { top: 180, bottom: 160, left: 180, right: 180 },
      verticalAlign: VerticalAlignTable.CENTER,
      borders,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill },
      children: [
        new Paragraph({ spacing: { before: 0, after: 70 }, children: [run(label.toUpperCase(), { bold: true, color: '64748B', size: 15 })] }),
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [run(`${value < 0 ? '-' : ''}${this.number(value)}`, { bold: true, color, size: 28 })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [run('MGA', { color: '64748B', size: 15 })] }),
      ],
    });
    const sectionTitle = (value: string) => new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [run(value, { bold: true, size: 24 })],
    });

    const categoryHeader = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        cell('Catégorie', 4300, { bold: true, color: 'FFFFFF', fill: '2563EB', size: 16 }),
        cell('Montant (MGA)', 3200, { bold: true, color: 'FFFFFF', fill: '2563EB', right: true, size: 16 }),
        cell('Part', 2700, { bold: true, color: 'FFFFFF', fill: '2563EB', right: true, size: 16 }),
      ],
    });
    const categoryRows = report.categories.length
      ? report.categories.map((category) => new TableRow({
        cantSplit: true,
        children: [
          cell(category.name, 4300),
          cell(this.amount(category.amount), 3200, { right: true, bold: true }),
          cell(`${category.percent} %`, 2700, { right: true, color: '64748B' }),
        ],
      }))
      : [new TableRow({ children: [cell('Aucune dépense sur cette période.', 10200, { color: '64748B', span: 3 })] })];

    const transactionHeader = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        cell('Date', 1400, { bold: true, color: 'FFFFFF', fill: '2563EB', size: 16 }),
        cell('Opération', 3100, { bold: true, color: 'FFFFFF', fill: '2563EB', size: 16 }),
        cell('Note', 3300, { bold: true, color: 'FFFFFF', fill: '2563EB', size: 16 }),
        cell('Montant', 2400, { bold: true, color: 'FFFFFF', fill: '2563EB', right: true, size: 16 }),
      ],
    });
    const transactionRows = report.transactions.length
      ? report.transactions.map((transaction) => new TableRow({
        cantSplit: true,
        children: [
          cell(this.shortDate(transaction.occurredAt), 1400, { size: 17 }),
          cell(`${transaction.isIncome ? 'Revenu' : 'Dépense'} · ${transaction.categoryName || 'Sans catégorie'}`, 3100, { size: 17 }),
          cell(transaction.reason || '—', 3300, { color: transaction.reason ? '475569' : '94A3B8', size: 17 }),
          cell(`${transaction.isIncome ? '+' : '-'}${this.amount(transaction.amount)}`, 2400, { right: true, bold: true, color: transaction.isIncome ? '047857' : 'B42318', size: 17 }),
        ],
      }))
      : [new TableRow({ children: [cell('Aucune transaction sur cette période.', 10200, { color: '64748B', span: 4 })] })];

    const document = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720, header: 360, footer: 360 } } },
        headers: {
          default: new Header({ children: [new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [run('KAJY VOLA', { bold: true, color: '2563EB', size: 17 }), run('  ·  Gestion du budget personnel', { color: '64748B', size: 17 })],
          })] }),
        },
        footers: {
          default: new Footer({ children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              run(`Kajy Vola · ${report.range.label} · Page `, { color: '64748B', size: 15 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 15, color: '64748B' }),
            ],
          })] }),
        },
        children: [
          new Paragraph({ spacing: { before: 120, after: 60 }, children: [run('RAPPORT DE BUDGET', { bold: true, color: '2563EB', size: 16 })] }),
          new Paragraph({ spacing: { before: 0, after: 90 }, children: [run(report.range.label, { bold: true, size: 40 })] }),
          new Paragraph({ spacing: { before: 0, after: 40 }, children: [run(report.range.rangeLabel, { color: '475569', size: 20 })] }),
          new Paragraph({ spacing: { before: 0, after: 220 }, children: [run(`Généré le ${this.generatedAt(report)}`, { color: '64748B', size: 16 })] }),
          new Table({
            rows: [new TableRow({ children: [
              metricCell('Revenus', report.summary.income, '047857', 'F8FAFC'),
              metricCell('Dépenses', report.summary.expenses, 'B42318', 'F8FAFC'),
              metricCell('Solde', report.summary.balance, report.summary.balance < 0 ? 'B42318' : '0F172A', 'EFF6FF'),
            ] })],
            width: { size: 10200, type: WidthType.DXA },
            columnWidths: [3400, 3400, 3400],
            layout: TableLayoutType.FIXED,
            borders,
          }),
          sectionTitle('Dépenses par catégorie'),
          new Table({ rows: [categoryHeader, ...categoryRows], width: { size: 10200, type: WidthType.DXA }, columnWidths: [4300, 3200, 2700], layout: TableLayoutType.FIXED, borders }),
          sectionTitle('Détail des transactions'),
          new Table({ rows: [transactionHeader, ...transactionRows], width: { size: 10200, type: WidthType.DXA }, columnWidths: [1400, 3100, 3300, 2400], layout: TableLayoutType.FIXED, borders }),
          new Table({
            rows: [new TableRow({ children: [
              cell('Solde net de la période', 7800, { bold: true, color: '1D4ED8', fill: 'EFF6FF', span: 3 }),
              cell(this.signedAmount(report.summary.balance), 2400, { bold: true, right: true, fill: 'EFF6FF', color: report.summary.balance < 0 ? 'B42318' : '0F172A' }),
            ] })],
            width: { size: 10200, type: WidthType.DXA },
            columnWidths: [1400, 3100, 3300, 2400],
            layout: TableLayoutType.FIXED,
            borders,
          }),
        ],
      }],
    });
    return Packer.toBlob(document);
  }

  private async shareNative(file: ReportFile, report: ReportData): Promise<void> {
    const data = await this.toBase64(file.blob);
    const savedFile = await Filesystem.writeFile({ data, directory: Directory.Cache, path: file.filename });
    const support = await Share.canShare();
    if (!support.value) throw new Error('Le partage de fichiers n’est pas disponible sur cet appareil.');
    await Share.share({
      title: 'Rapport Kajy Vola',
      text: `Rapport ${report.range.label} — ${report.range.rangeLabel}`,
      files: [savedFile.uri],
      dialogTitle: 'Exporter le rapport',
    });
  }

  private downloadOnWeb(file: ReportFile): void {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private shortDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return this.normaliseText(value.slice(0, 10));
    return this.normaliseText(new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day))).replace('.', '');
  }

  private number(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.abs(Math.round(value))).replace(/[\u00A0\u202F]/g, ' ');
  }

  private amount(value: number): string { return `${this.number(value)} MGA`; }
  private signedAmount(value: number): string { return `${value > 0 ? '+' : value < 0 ? '-' : ''}${this.amount(value)}`; }
  private generatedAt(report: ReportData): string { return this.normaliseText(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(report.generatedAt)); }
  private escapeCsv(value: string | number): string {
    const safe = typeof value === 'number' ? String(Number.isFinite(value) ? Math.round(value) : 0) : this.safeSpreadsheetValue(this.normaliseText(value));
    return `"${safe.replace(/"/g, '""')}"`;
  }
  private escapeXml(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
  private cleanText(value: string): string { return value.replace(/[\u0000-\u001F\uFEFF]/g, ' ').trim(); }
  private normaliseText(value: string): string { return this.cleanText(value).normalize('NFC').replace(/[\u00A0\u202F]/g, ' ').replace(/[\u2013\u2014]/g, '-'); }
  private safeSpreadsheetValue(value: string): string { return /^[=+\-@]/.test(value) ? `'${value}` : value; }

  private utf16LeCsv(value: string): Blob {
    const bytes = new Uint8Array(2 + value.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      bytes[index * 2 + 2] = code & 0xff;
      bytes[index * 2 + 3] = code >>> 8;
    }
    return new Blob([bytes], { type: 'text/csv;charset=utf-16le' });
  }

  private toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('Impossible de préparer le fichier.'));
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(blob);
    });
  }
}
