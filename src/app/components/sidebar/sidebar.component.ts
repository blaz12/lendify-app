import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  currentRole: string = '';
  userName: string = '';
  isCollapsed: boolean = false; // State Sidebar

  constructor(private router: Router) {}

  ngOnInit() {
    this.currentRole = localStorage.getItem('demoRole') || 'student';
    this.userName = localStorage.getItem('userName') || 'User';

    // Cek status sidebar terakhir dari penyimpanan
    const savedState = localStorage.getItem('sidebarCollapsed');
    this.isCollapsed = savedState === 'true';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    // Simpan preferensi user
    localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
  }

  logout() {
    localStorage.removeItem('demoRole');
    localStorage.removeItem('userName');
    this.router.navigate(['/login']);
  }
}
