import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  authMessage: string | null = null;

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'unauthenticated') {
        this.authMessage = 'Please login first';
      } else if (params['reason'] === 'forbidden') {
        this.authMessage = 'You do not have permission to access that page.';
      }
    });
  }

  login(): void {
    this.auth.loginWithRedirect();
  }
}
