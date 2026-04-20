import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PunchRecord {
  id: string; date: string;
  punchIn: string; punchOut: string | null;
  totalHours: number | null; note: string;
}

@Injectable({ providedIn: 'root' })
export class PunchService {
  private _isBrowser: boolean;
  private _records     = signal<PunchRecord[]>([]);
  private _activePunch = signal<{ id: string; startTime: Date } | null>(null);
  private _elapsed     = signal<number>(0);
  private _timer: any  = null;

  records      = this._records.asReadonly();
  activePunch  = this._activePunch.asReadonly();
  elapsed      = this._elapsed.asReadonly();
  isPunchedIn  = computed(() => this._activePunch() !== null);

  elapsedFormatted = computed(() => {
    const s = this._elapsed();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this._isBrowser = isPlatformBrowser(platformId);
    if (!this._isBrowser) return;

    this._records.set(this._load());

    const stored = localStorage.getItem('ts-active-punch');
    if (stored) {
      const { id, startTime } = JSON.parse(stored);
      const st = new Date(startTime);
      this._activePunch.set({ id, startTime: st });
      this._startTimer(st);
    }
  }

  punchIn(note = ''): void {
    if (this.isPunchedIn() || !this._isBrowser) return;
    const now = new Date();
    const id  = `punch-${Date.now()}`;
    const record: PunchRecord = {
      id, date: now.toLocaleDateString('en-CA'),
      punchIn: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      punchOut: null, totalHours: null, note
    };
    this._records.update(r => [record, ...r]);
    this._activePunch.set({ id, startTime: now });
    localStorage.setItem('ts-active-punch', JSON.stringify({ id, startTime: now.toISOString() }));
    this._save();
    this._startTimer(now);
  }

  punchOut(): void {
    const active = this._activePunch();
    if (!active || !this._isBrowser) return;
    const now = new Date();
    const totalHours = parseFloat(((now.getTime() - active.startTime.getTime()) / 3_600_000).toFixed(2));
    this._records.update(records => records.map(r =>
      r.id === active.id
        ? { ...r, punchOut: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), totalHours }
        : r
    ));
    this._activePunch.set(null);
    this._elapsed.set(0);
    clearInterval(this._timer);
    localStorage.removeItem('ts-active-punch');
    this._save();
  }

  getTodayHours(): number {
    const today = new Date().toLocaleDateString('en-CA');
    return this._records()
      .filter(r => r.date === today && r.totalHours !== null)
      .reduce((s, r) => s + (r.totalHours ?? 0), 0);
  }

  getWeekHours(): number {
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    return this._records()
      .filter(r => r.totalHours !== null && new Date(r.date) >= monday)
      .reduce((s, r) => s + (r.totalHours ?? 0), 0);
  }

  private _startTimer(from: Date): void {
    clearInterval(this._timer);
    const tick = () => this._elapsed.set(Math.floor((Date.now() - from.getTime()) / 1000));
    tick();
    this._timer = setInterval(tick, 1000);
  }

  private _save(): void { localStorage.setItem('ts-punch-records', JSON.stringify(this._records())); }
  private _load(): PunchRecord[] {
    try { return JSON.parse(localStorage.getItem('ts-punch-records') || '[]'); }
    catch { return []; }
  }
}
