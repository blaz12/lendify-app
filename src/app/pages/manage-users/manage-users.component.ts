import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Penting untuk ngModel search
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, User } from '../../services/database.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {

  // Data
  allUsers: User[] = [];      // Data mentah dari DB sesuai tab
  filteredUsers: User[] = []; // Data yang tampil (setelah search)

  userRole: string = 'admin';
  currentTab: 'active' | 'pending' | 'deleted' = 'active';

  // Search State
  searchTerm: string = '';

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.loadData();
  }

  // Load data berdasarkan Tab yang dipilih
  loadData() {
    this.searchTerm = ''; // Reset search saat ganti tab

    if (this.currentTab === 'active') {
      this.db.getActiveUsers().subscribe(data => {
        this.allUsers = data;
        this.applyFilter();
      });
    } else if (this.currentTab === 'pending') {
      this.db.getPendingUsers().subscribe(data => {
        this.allUsers = data;
        this.applyFilter();
      });
    } else {
      this.db.getDeletedUsers().subscribe(data => {
        this.allUsers = data;
        this.applyFilter();
      });
    }
  }

  // Fungsi Ganti Tab
  switchTab(tab: 'active' | 'pending' | 'deleted') {
    this.currentTab = tab;
    this.loadData();
  }

  // Fungsi Search Real-time
  applyFilter() {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.allUsers];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.allUsers.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.studentId.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
  }

  // --- ACTIONS ---

  async approveUser(user: User) {
    if(!user.id) return;
    if(confirm(`Approve registration for ${user.name}?`)) {
      await this.db.approveUser(user.id);
      // Data otomatis refresh karena subscription realtime
    }
  }

  async rejectUser(user: User) {
    if(!user.id) return;
    if(confirm(`Reject and delete request from ${user.name}?`)) {
      await this.db.rejectUser(user.id);
    }
  }

  async deactivateUser(id: string | undefined) {
    if(!id) return;
    if(confirm('Deactivate (Soft Delete) this user? They won\'t be able to login.')) {
      await this.db.softDeleteUser(id);
    }
  }

  async recoverUser(id: string | undefined) {
    if(!id) return;
    if(confirm('Recover this user account? They will become Active again.')) {
      await this.db.recoverUser(id);
      this.switchTab('active'); // Pindah ke tab active untuk lihat hasil
    }
  }
}
