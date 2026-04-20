import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HeaderComponent } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { ThemeService } from './core/services/theme.service';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeFadeAnimation = trigger('routeFade', [
  transition('* <=> *', [
    group([
      query(
        ':leave',
        [
          style({ opacity: 1, transform: 'translateY(0)' }),
          animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' })),
        ],
        { optional: true },
      ),
      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          animate(
            '280ms 120ms cubic-bezier(0.16,1,0.3,1)',
            style({ opacity: 1, transform: 'translateY(0)' }),
          ),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, Footer],
  templateUrl: './app.html',
  animations: [routeFadeAnimation],
})
export class App implements OnInit {
  constructor(
    public auth: AuthService,
    private theme: ThemeService,
  ) {}

  ngOnInit(): void {
    // ThemeService constructor applies theme on boot
  }

  getRouteState(outlet: RouterOutlet): string {
    if (!outlet || !outlet.isActivated) {
      return 'default';
    }

    return (
      outlet.activatedRouteData?.['animation'] ??
      outlet.activatedRoute?.snapshot?.url?.[0]?.path ??
      'default'
    );
  }
}
