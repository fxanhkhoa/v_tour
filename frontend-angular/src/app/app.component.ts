import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule
  ],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <span class="logo-title">
        <mat-icon>explore</mat-icon>
        Tour Guide Hub
      </span>
      <span class="spacer"></span>
      <button mat-flat-button color="accent" class="grab-btn">
        <mat-icon>electric_scooter</mat-icon>
        Request Local Guide (Grab-Style)
      </button>
    </mat-toolbar>

    <div class="container my-4">
      <mat-tab-group>
        <mat-tab label="Discover Landmarks">
          <div class="landmark-grid">
            <mat-card class="landmark-card">
              <img mat-card-image src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80" alt="Ben Thanh Market">
              <mat-card-header>
                <mat-card-title>Ben Thanh Market</mat-card-title>
                <mat-card-subtitle>Ho Chi Minh City • Heritage</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>100-year-old historic market with food stalls, handicrafts and coffee.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">View Highlights</button>
                <button mat-raised-button color="accent">Book Local Guide</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .app-toolbar {
      display: flex;
      gap: 12px;
      background: linear-gradient(135deg, #0d9488, #0f766e);
      color: white;
    }
    .spacer { flex: 1 1 auto; }
    .logo-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.25rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .landmark-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 16px; }
    .landmark-card { border-radius: 16px; overflow: hidden; }
  `]
})
export class AppComponent {
  title = 'Tour Guide Hub Angular Material';
}
