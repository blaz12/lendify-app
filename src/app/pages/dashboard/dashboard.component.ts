import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, Item } from '../../services/database.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  userRole: string = 'admin';
  userName: string = '';
  now: Date = new Date();
  private timerId: any;

  // Stats
  totalItemsCount: number = 0;
  totalAvailableCount: number = 0;
  totalBorrowedCount: number = 0;

  // Lists
  allItems: Item[] = [];
  availableItems: Item[] = [];
  lowStockItems: Item[] = [];
  activeLoans: any[] = [];

  // Widget Lists
  recentLogs: any[] = [];
  myActiveLoans: any[] = [];

  // [NEW] Notification List
  overdueItems: any[] = [];

  activeCard: string | null = null;

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.userName = localStorage.getItem('userName') || 'User';

    this.timerId = setInterval(() => { this.now = new Date(); }, 1000);

    this.db.getItems().subscribe(items => {
      this.allItems = items;
      this.processItemStats(items);
    });

    this.db.getActiveBorrowings().subscribe(logs => {
      this.checkOverdueItems(logs); // [CHECK DUE DATE]

      if (this.userRole === 'admin') {
        this.totalBorrowedCount = logs.length;
        this.activeLoans = logs;

        this.db.getAllBorrowings().subscribe(allLogs => {
           this.recentLogs = allLogs
            .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
            .slice(0, 5);
        });
      } else {
        const myLogs = logs.filter(log => log.borrower === this.userName);
        this.totalBorrowedCount = myLogs.length;
        this.activeLoans = myLogs;
        this.myActiveLoans = myLogs;
      }
    });
  }

  ngOnDestroy() { if (this.timerId) clearInterval(this.timerId); }

  processItemStats(items: Item[]) {
    this.totalAvailableCount = 0;
    this.availableItems = [];
    this.lowStockItems = [];

    items.forEach(item => {
      const stock = Number(item.stock);
      if (!isNaN(stock) && stock > 0) {
        this.availableItems.push(item);
        this.totalAvailableCount += stock;
        if (stock < 3) this.lowStockItems.push(item);
      }
    });
  }

  // [NEW LOGIC] Cek barang yang hampir jatuh tempo
  checkOverdueItems(logs: any[]) {
    this.overdueItems = [];
    const today = new Date().getTime();

    logs.forEach(log => {
      // Hanya cek yang punya dueDate dan status Borrowed (bukan Pending)
      if (log.dueDate && log.status === 'Borrowed') {

        // Filter: Admin lihat semua, Student lihat punya sendiri
        if (this.userRole === 'student' && log.borrower !== this.userName) return;

        const dueTime = new Date(log.dueDate).getTime();
        const diffTime = dueTime - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Jika sisa waktu <= 2 hari (termasuk minus/telat)
        if (diffDays <= 2) {
          this.overdueItems.push({
            ...log,
            daysLeft: diffDays // Helper property untuk display
          });
        }
      }
    });
  }

  toggleCard(cardName: string) {
    this.activeCard = this.activeCard === cardName ? null : cardName;
  }
}
