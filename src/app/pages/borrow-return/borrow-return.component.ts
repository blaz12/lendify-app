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

  // Data Arrays
  myBorrowings: any[] = [];
  allHistory: any[] = [];
  activeLoans: any[] = [];
  pendingRequests: any[] = [];

  // Admin Tabs
  adminTab: 'active' | 'requests' | 'history' = 'active';

  // Cache Items (untuk cek stok saat return)
  allItemsCache: any[] = [];

  // [NEW] Modal Return State
  isReturnModalOpen: boolean = false;
  selectedLog: any = null;
  returnCondition: string = 'Good'; // Default

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'student';
    this.userName = localStorage.getItem('userName') || 'User';

    // Load Items untuk stok referensi
    this.db.getItems().subscribe(items => this.allItemsCache = items);

    if (this.userRole === 'admin') {
      this.db.getAllBorrowings().subscribe(logs => {
        const sorted = this.processLogs(logs); // Proses Overdue dll
        this.allHistory = sorted;
        this.activeLoans = sorted.filter(log => log.status === 'Borrowed');
        this.pendingRequests = sorted.filter(log => log.status === 'Pending');
      });
    } else {
      this.db.getActiveBorrowings().subscribe(logs => {
        const myLogs = logs.filter(log => log.borrower === this.userName);
        this.myBorrowings = this.processLogs(myLogs);
      });
    }
  }

  // [NEW] Helper untuk proses data (hitung Overdue)
  processLogs(logs: any[]) {
    const today = new Date().getTime();
    return logs.map(log => {
      let isOverdue = false;
      if (log.status === 'Borrowed' && log.dueDate) {
        const due = new Date(log.dueDate).getTime();
        if (today > due) isOverdue = true;
      }
      return { ...log, isOverdue };
    }).sort((a, b) => new Date(b.requestDate || b.borrowDate).getTime() - new Date(a.requestDate || a.borrowDate).getTime());
  }

  // --- ACTIONS ---

  async approveRequest(log: any) {
    if(!confirm(`Approve loan for ${log.borrower}?`)) return;
    try { await this.db.approveBorrowRequest(log.id); } catch(e) { console.error(e); }
  }

  async rejectRequest(log: any) {
    if(!confirm(`Reject request? Stock will be restored.`)) return;
    try {
      await this.db.rejectBorrowRequest(log);
      const item = this.allItemsCache.find(i => i.id === log.itemId);
      const currentStock = item ? item.stock : 0;
      await this.db.restoreStock(log.itemId, log.qty, currentStock);
    } catch(e) { console.error(e); }
  }

  // [NEW] Buka Modal Return
  openReturnModal(log: any) {
    this.selectedLog = log;
    this.returnCondition = 'Good'; // Reset
    this.isReturnModalOpen = true;
  }

  closeReturnModal() {
    this.isReturnModalOpen = false;
    this.selectedLog = null;
  }

  // [NEW] Submit Return dengan Kondisi
  async submitReturn() {
    if (!this.selectedLog) return;

    const item = this.allItemsCache.find(i => i.id === this.selectedLog.itemId);
    const currentStock = item ? item.stock : 0;

    try {
        await this.db.returnItem(
          this.selectedLog.id,
          this.selectedLog.itemId,
          this.selectedLog.qty,
          currentStock,
          this.returnCondition // Kirim kondisi
        );
        alert('Item returned successfully.');
        this.closeReturnModal();
    } catch (e) {
        console.error(e);
        alert('Error processing return.');
    }
  }
}
