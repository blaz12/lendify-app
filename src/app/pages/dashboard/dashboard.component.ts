import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnDestroy
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

  // Real-time Clock Variable
  now: Date = new Date();
  private timerId: any;

  // Stats
  totalItems: number = 0;
  totalAvailable: number = 0;
  totalBorrowed: number = 0;
  lowStockItems: Item[] = [];

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';

    // 1. Jalankan Timer Setiap Detik
    this.timerId = setInterval(() => {
      this.now = new Date();
    }, 1000);

    // 2. Load Data (Sama seperti sebelumnya)
    this.db.getItems().subscribe(items => {
      this.calculateStats(items);
      this.checkLowStock(items);
    });
  }

  // Wajib bersihkan timer saat pindah halaman agar memori aman
  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  calculateStats(items: Item[]) {
    this.totalItems = 0;
    this.totalAvailable = 0;
    items.forEach(item => {
      this.totalItems += item.stock || 0;
      this.totalAvailable += item.stock;
    });
    // Total Items (Fisik) tetap, Available berkurang sesuai stok realtime.
    // Jika ingin hitung yang sedang dipinjam:
    // Kita asumsikan "Total Awal" - "Total Sekarang" = Dipinjam.
    // (Agar akurat, totalItems harusnya ambil dari 'inventory awal', tapi disini kita pakai logic stok sederhana)
    // Di sistem ini: Stock berkurang saat pinjam. Jadi Borrowed = Total Inventory (Static) - Current Stock.
    // Untuk demo, kita pakai variable dummy atau logic: Borrowed dihitung dari Active Logs jika mau akurat.
    // Tapi cara termudah: TotalBorrowed = (Total Awal yg kita set manual/db) - Total Sekarang.
    // Karena kita tidak simpan Total Awal per item, kita biarkan logic sederhana:
    // Kita hitung jumlah dokumen di collection 'borrowings' status 'Borrowed' (Idealnya)

    // PERBAIKAN LOGIC STATS (Agar tidak minus/aneh):
    // Kita ambil data borrowing juga di Dashboard agar akurat.
    this.db.getActiveBorrowings().subscribe(logs => {
        this.totalBorrowed = logs.length; // Hitung jumlah transaksi pinjam aktif
        // Total Aset = Available + Borrowed
        this.totalItems = this.totalAvailable + this.totalBorrowed;
    });
  }

  checkLowStock(items: Item[]) {
    this.lowStockItems = items.filter(item => item.stock < 3 && item.stock > 0);
  }
}
