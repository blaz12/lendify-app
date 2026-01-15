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

  // Clock
  now: Date = new Date();
  private timerId: any;

  // Stats Counters
  totalItemsCount: number = 0;
  totalAvailableCount: number = 0;
  totalBorrowedCount: number = 0;

  // Data Arrays (Untuk Detail Slide Down)
  allItems: Item[] = [];       // Data untuk "Total Assets"
  availableItems: Item[] = []; // Data untuk "Available"
  lowStockItems: Item[] = [];  // Data untuk "Low Stock"
  activeLoans: any[] = [];     // Data untuk "On Loan"

  // Data Widget Lain
  recentLogs: any[] = [];
  myActiveLoans: any[] = [];

  // State untuk Slide Down Card
  // Values: 'total' | 'available' | 'loan' | 'low' | null
  activeCard: string | null = null;

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.userName = localStorage.getItem('userName') || 'User';

    // 1. Timer
    this.timerId = setInterval(() => { this.now = new Date(); }, 1000);

    // 2. Load Item Data
    this.db.getItems().subscribe(items => {
      this.allItems = items;
      this.processItemStats(items);
    });

    // 3. Load Borrowing Data
    // Kita ambil semua active borrowings untuk counter & detail "On Loan"
    this.db.getActiveBorrowings().subscribe(logs => {
      this.totalBorrowedCount = logs.length;

      // Jika Admin, activeLoans berisi semua orang. Jika Student, filter punya sendiri (opsional, tapi dashboard biasanya global stats)
      // Tapi untuk konsistensi, jika Student melihat angka "On Loan" global, dia mungkin bingung.
      // Mari kita buat context:
      // Admin -> Global Stats. Student -> Personal Stats di card?
      // Biasanya dashboard student menampilkan "My Active Loans" di card "On Loan".

      if (this.userRole === 'admin') {
        this.activeLoans = logs; // Semua pinjaman aktif

        // Load Recent Activity (Admin)
        this.db.getAllBorrowings().subscribe(allLogs => {
           this.recentLogs = allLogs
            .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
            .slice(0, 5);
        });

      } else {
        // Student View
        const myLogs = logs.filter(log => log.borrower === this.userName);
        this.activeLoans = myLogs; // Detail card "On Loan" hanya punya dia
        this.totalBorrowedCount = myLogs.length; // Angka di card hanya punya dia

        this.myActiveLoans = myLogs; // Untuk widget tabel bawah
      }
    });
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  processItemStats(items: Item[]) {
    this.totalItemsCount = 0;
    this.totalAvailableCount = 0;
    this.availableItems = [];
    this.lowStockItems = [];

    items.forEach(item => {
      const stock = Number(item.stock);
      if (isNaN(stock)) return;

      // Total Aset (Stok Gudang + Yang Dipinjam ???)
      // Simplifikasi: Total Assets = Sum of current stock + (Items currently borrowed? Agak susah dilacak tanpa relasi ID)
      // Mari kita pakai logic: Total Assets = Semua barang yang terdaftar di sistem (inventory list)
      // Tapi inventory list 'stock' berkurang saat dipinjam.
      // Jadi Total Asset Fisik = Stock Sekarang + Sedang Dipinjam.
      // Tapi untuk List Detail, kita tampilkan saja apa adanya di database.

      this.totalItemsCount += stock; // Ini stok tersedia + stok yang mungkin nanti dikembalikan? Tidak, ini stok saat ini.
      // Revisi: Total Asset biasanya Stok Awal. Tapi karena sistem kita potong stok,
      // maka Total Item Count di card kita anggap = Available Stock + Borrowed Count.

      if (stock > 0) {
        this.availableItems.push(item);
        this.totalAvailableCount += stock;
      }

      if (stock > 0 && stock < 3) {
        this.lowStockItems.push(item);
      }
    });

    // Koreksi Total Asset agar statis (Available + Borrowed)
    // Kita update nanti setelah borrowing data masuk, atau biarkan reactive.
    // Agar simple, Total Assets di card kita ganti maknanya jadi "Total Stock Value" atau biarkan dynamic.
    // Mari gunakan: Total Assets = totalAvailableCount + totalBorrowedCount (di HTML)
  }

  // Fungsi Klik Card
  toggleCard(cardName: string) {
    // Jika diklik lagi, tutup. Jika beda, buka yang baru.
    if (this.activeCard === cardName) {
      this.activeCard = null;
    } else {
      this.activeCard = cardName;
    }
  }
}
