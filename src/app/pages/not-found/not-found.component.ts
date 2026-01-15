import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Oops! The page you are looking for does not exist.</p>
      <a routerLink="/dashboard" class="btn-home">Go Back Home</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      height: 100vh;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      background: #f8fafc; color: #334155;
      text-align: center;
    }
    h1 { font-size: 6rem; margin: 0; color: #5d5fef; line-height: 1; }
    h2 { font-size: 2rem; margin: 10px 0; }
    p { color: #64748b; margin-bottom: 2rem; }
    .btn-home {
      padding: 12px 24px; background: #5d5fef; color: white;
      text-decoration: none; border-radius: 8px; font-weight: 600;
      transition: background 0.2s;
    }
    .btn-home:hover { background: #4b4dce; }
  `]
})
export class NotFoundComponent {}
