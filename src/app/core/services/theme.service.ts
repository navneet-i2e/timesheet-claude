import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isBrowser: boolean;
  private _theme = signal<Theme>('light');

  theme = this._theme.asReadonly();
  isDark = () => this._theme() === 'dark';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this._isBrowser = isPlatformBrowser(platformId);
    if (this._isBrowser) {
      const stored = localStorage.getItem('ts-theme') as Theme;
      // Only honour stored value if it's a valid theme
      if (stored === 'dark' || stored === 'light') {
        this._theme.set(stored);
      } else {
        // First visit or stale value — default to light
        this._theme.set('light');
      }
    }

    effect(() => {
      if (!this._isBrowser) return;
      const t = this._theme();
      const root = document.documentElement;
      root.classList.toggle('dark-theme',  t === 'dark');
      root.classList.toggle('light-theme', t === 'light');
      localStorage.setItem('ts-theme', t);
    });

    if (this._isBrowser) {
      const t = this._theme();
      document.documentElement.classList.toggle('dark-theme',  t === 'dark');
      document.documentElement.classList.toggle('light-theme', t === 'light');
    }
  }

  toggle(): void {
    this._theme.set(this._theme() === 'dark' ? 'light' : 'dark');
  }
}
