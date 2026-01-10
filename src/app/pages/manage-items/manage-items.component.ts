import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, Item } from '../../services/database.service';

// Interface untuk item dengan input quantity di Modal
interface BorrowItem extends Item {
  requestQty: number;
}

@Component({
  selector: 'app-manage-items',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './manage-items.component.html',
  styleUrls: ['./manage-items.component.scss']
})
export class ManageItemsComponent implements OnInit {

  // Data Barang (Real dari Firebase)
  items: BorrowItem[] = [];

  // Data User Login
  userRole: string = 'admin';

  // --- STATE ADMIN (Form Input Data Asli) ---
  showForm: boolean = false;
  isSaving: boolean = false;
  newItem: Item = {
    name: '',
    category: 'Laptop',
    stock: 0,
    location: '',
    status: 'Available'
  };

  // --- STATE STUDENT (Modal Borrow) ---
  isModalOpen: boolean = false;
  isSubmitting: boolean = false;
  borrowRequest = {
    location: '',
    purpose: '',
    borrowerName: ''
  };

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    // 1. Ambil Role & Nama dari LocalStorage
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.borrowRequest.borrowerName = localStorage.getItem('userName') || 'Student';

    // 2. Ambil Data Real-time dari Firebase
    this.db.getItems().subscribe(data => {
      // Mapping data agar siap untuk fitur borrow (tambah field requestQty)
      this.items = data.map(i => ({
        ...i,
        requestQty: 0
      } as BorrowItem));
    });
  }

  // ==========================================
  // 1. FITUR ADMIN: INPUT DATA ASLI (CRUD)
  // ==========================================

  async saveRealItem() {
    // Validasi Form
    if (!this.newItem.name || !this.newItem.location || this.newItem.stock < 0) {
      alert('Please fill in all fields correctly.');
      return;
    }

    this.isSaving = true;

    try {
      // Simpan ke Firebase
      await this.db.addItem(this.newItem);

      alert('Item successfully added to database!');
      this.showForm = false; // Tutup form

      // Reset Form agar bersih untuk input berikutnya
      this.newItem = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available' };

    } catch (err) {
      console.error(err);
      alert('Error saving item.');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteItem(id: string | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this item permanently?')) {
      await this.db.deleteItem(id);
    }
  }

  // ==========================================
  // 2. FITUR STUDENT: BULK BORROW (MODAL)
  // ==========================================

  openBorrowModal() {
    // Reset Form Peminjaman
    this.borrowRequest.location = '';
    this.borrowRequest.purpose = '';
    // Reset angka quantity di tabel pemilihan
    this.items.forEach(i => i.requestQty = 0);

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async submitBorrow() {
    // Validasi Header Form
    if (!this.borrowRequest.location || !this.borrowRequest.purpose) {
      alert('Please fill in Location and Purpose.');
      return;
    }

    // Ambil barang yang dipilih (qty > 0)
    const selectedItems = this.items.filter(i => i.requestQty > 0);

    if (selectedItems.length === 0) {
      alert('Please select at least one item.');
      return;
    }

    // Validasi Stok (Backend juga akan cek, tapi frontend cek dulu biar cepat)
    const invalidItem = selectedItems.find(i => i.requestQty > i.stock);
    if (invalidItem) {
      alert(`Request for ${invalidItem.name} exceeds stock (${invalidItem.stock}).`);
      return;
    }

    this.isSubmitting = true;

    try {
      // Loop save ke database
      for (const item of selectedItems) {
        await this.db.borrowItem(
          item,
          this.borrowRequest.borrowerName,
          this.borrowRequest.location,
          item.requestQty
        );
      }

      alert('Borrow Request Submitted!');
      this.closeModal();

    } catch (error) {
      console.error(error);
      alert('Failed to submit request.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
