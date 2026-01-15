import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, User } from '../../services/database.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {

  // Tab Management
  currentTab: string = 'active'; // 'active' | 'pending' | 'deleted'

  // Data Arrays
  activeUsers: User[] = [];
  pendingUsers: User[] = [];
  deletedUsers: User[] = [];

  userRole: string = 'admin';

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.loadData();
  }

  loadData() {
    // 1. Ambil User Aktif
    this.db.getActiveUsers().subscribe(data => this.activeUsers = data);

    // 2. Ambil Request Pending (Mahasiswa Baru)
    this.db.getPendingUsers().subscribe(data => this.pendingUsers = data);

    // 3. Ambil User Terhapus
    this.db.getDeletedUsers().subscribe(data => this.deletedUsers = data);
  }

  switchTab(tab: string) {
    this.currentTab = tab;
  }

  // --- ADMIN ACTIONS ---

  // 1. Approve Mahasiswa
  async approveUser(user: User) {
    if(!user.id) return;
    if(confirm(`Approve registration for ${user.name}?`)) {
      try {
        await this.db.approveUser(user.id);
        alert('User Approved Successfully!');
        this.currentTab = 'active'; // Pindah tab agar admin lihat hasilnya
      } catch(err) {
        console.error(err);
      }
    }
  }

  // 2. Reject Mahasiswa
  async rejectUser(user: User) {
    if(!user.id) return;
    if(confirm(`Reject and delete request from ${user.name}?`)) {
      await this.db.rejectUser(user.id);
    }
  }

  // 3. Deactivate User (Soft Delete)
  async deleteUser(id: string | undefined) {
    if(!id) return;
    if(confirm('Deactivate this user?')) {
      await this.db.softDeleteUser(id);
    }
  }
  // 4. Recover Deleted User
  async recoverUser(id: string | undefined) {
    if(!id) return;
    if(confirm('Recover this user account?')) {
      await this.db.recoverUser(id);
      alert('User recovered successfully!');
      this.currentTab = 'active'; // Pindah ke tab active untuk melihat hasilnya
    }
  }
}
