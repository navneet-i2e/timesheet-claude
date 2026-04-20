import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private _isBrowser: boolean;
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this._isBrowser = isPlatformBrowser(platformId);
  }

  exportToExcel(data: any[], filename = 'report'): void {
    if (!data.length || !this._isBrowser) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return /[",\n]/.test(str) ? `"${str}"` : str;
        }).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this._download(blob, `${filename}.csv`);
  }

  exportToPDF(title = 'Report', contentHtml: string): void {
    if (!this._isBrowser) return;
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;
    const isDark = document.documentElement.classList.contains('dark-theme');
    const bg   = isDark ? '#0f172a' : '#ffffff';
    const text = isDark ? '#e2e8f0' : '#1e293b';

    printWin.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: ${bg}; color: ${text};
               padding: 24px; font-size: 13px; }
        h1   { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        p.meta { color: #94a3b8; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th    { background: ${isDark ? '#1e293b' : '#f1f5f9'}; padding: 8px 12px;
                text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
        td    { padding: 8px 12px; border-bottom: 1px solid ${isDark ? '#1e293b' : '#e2e8f0'}; }
        tr:nth-child(even) td { background: ${isDark ? '#1e293b' : '#f8fafc'}; }
        .summary { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
        .kpi { background: ${isDark ? '#1e293b' : '#f1f5f9'}; border-radius: 8px; padding: 12px 18px; }
        .kpi-val { font-size: 22px; font-weight: 700; color: #6366f1; }
        .kpi-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <h1>${title}</h1>
      <p class="meta">Generated: ${new Date().toLocaleString()}</p>
      ${contentHtml}
    </body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); printWin.close(); }, 500);
  }

  private _download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
