import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-borrow-return',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './borrow-return.component.html',
  styleUrls: ['./borrow-return.component.scss']
})
export class BorrowReturnComponent implements OnInit {

  userRole: string = 'student';
  userName: string = '';

  // Data
  myBorrowings: any[] = [];
  allHistory: any[] = [];
  activeLoans: any[] = [];
  pendingRequests: any[] = []; // NEW: Daftar tunggu konfirmasi

  // Tab Admin: active | requests | history
  adminTab: 'active' | 'requests' | 'history' = 'active';

  // Cache Item untuk cek stok
  allItemsCache: any[] = [];

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'student';
    this.userName = localStorage.getItem('userName') || 'User';

    // Load Stok Barang untuk referensi pengembalian
    this.db.getItems().subscribe(items => this.allItemsCache = items);

    if (this.userRole === 'admin') {
      // --- LOGIK ADMIN ---
      this.db.getAllBorrowings().subscribe(logs => {
        // Sort Terbaru
        const sortedLogs = logs.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());

        this.allHistory = sortedLogs;
        this.activeLoans = sortedLogs.filter(log => log.status === 'Borrowed');
        // Filter Pending
        this.pendingRequests = sortedLogs.filter(log => log.status === 'Pending');
      });

    } else {
      // --- LOGIK STUDENT ---
      this.db.getActiveBorrowings().subscribe(logs => {
        // Student melihat Pending, Borrowed, dan Returned miliknya
        this.myBorrowings = logs
          .filter(log => log.borrower === this.userName)
          .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
      });
    }
  }

  // --- ADMIN ACTIONS ---

  async approveRequest(log: any) {
    if(!confirm(`Approve loan for ${log.borrower}?`)) return;
    try {
      await this.db.approveBorrowRequest(log.id);
      // alert('Approved!'); // Optional
    } catch(e) { console.error(e); }
  }

  async rejectRequest(log: any) {
    if(!confirm(`Reject request from ${log.borrower}? Stock will be restored.`)) return;
    try {
      // 1. Update Status jadi Rejected
      await this.db.rejectBorrowRequest(log);

      // 2. Kembalikan Stok
      const item = this.allItemsCache.find(i => i.id === log.itemId);
      const currentStock = item ? item.stock : 0;
      await this.db.restoreStock(log.itemId, log.qty, currentStock);

      alert('Request rejected and stock restored.');
    } catch(e) { console.error(e); }
  }

  // --- GENERAL ACTIONS ---

  async processReturn(borrowLog: any, isForce: boolean = false) {
    const message = isForce
      ? `Force return item '${borrowLog.itemName}'?`
      : `Return '${borrowLog.itemName}'?`;

    if(!confirm(message)) return;

    const item = this.allItemsCache.find(i => i.id === borrowLog.itemId);
    const currentStock = item ? item.stock : 0;

    try {
        await this.db.returnItem(borrowLog.id, borrowLog.itemId, borrowLog.qty, currentStock);
    } catch (e) { console.error(e); }
  }

  returnItem(log: any) { this.processReturn(log, false); }
  adminForceReturn(log: any) { this.processReturn(log, true); }
}
