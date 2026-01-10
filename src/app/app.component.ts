import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // WAJIB
  imports: [RouterOutlet], // Import RouterOutlet agar bisa ganti halaman
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lendify-app';
}
