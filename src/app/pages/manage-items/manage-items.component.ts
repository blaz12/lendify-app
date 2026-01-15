import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, Item } from '../../services/database.service';

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

  items: BorrowItem[] = [];         // Data Mentah (Semua Barang)
  filteredItems: BorrowItem[] = []; // Data Tampil (Hasil Filter/Search)

  userRole: string = 'admin';

  // State Admin
  showForm: boolean = false;
  isSaving: boolean = false;
  newItem: Item = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available', imageUrl: '' };

  // State Student
  isModalOpen: boolean = false;
  isSubmitting: boolean = false;

  borrowRequest = { location: '', purpose: '', borrowerName: '', startDate: '', endDate: '' };
  minDate: string = '';

  // Sorting & Filtering State
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // [NEW] FILTER STATE
  searchTerm: string = '';
  selectedCategory: string = 'All';
  categories: string[] = ['Laptop', 'Camera', 'Audio', 'Projector', 'Accessory', 'Other'];

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.borrowRequest.borrowerName = localStorage.getItem('userName') || 'Student';
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.db.getItems().subscribe(data => {
      // Simpan ke data mentah
      this.items = data.map(i => ({ ...i, requestQty: 0 } as BorrowItem));

      // Terapkan filter awal (menampilkan semua)
      this.applyFilters();
    });
  }

  // ==========================================
  // [NEW] FILTER & SEARCH LOGIC
  // ==========================================

  applyFilters() {
    let tempItems = [...this.items]; // Copy array

    // 1. Filter by Category
    if (this.selectedCategory !== 'All') {
      tempItems = tempItems.filter(i => i.category === this.selectedCategory);
    }

    // 2. Filter by Search Term (Name)
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      tempItems = tempItems.filter(i => i.name.toLowerCase().includes(term));
    }

    // 3. Apply Result
    this.filteredItems = tempItems;

    // 4. Re-apply sorting if active
    if (this.sortColumn) {
      this.sortData(this.sortColumn);
    }
  }

  // Reset Filter
  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.applyFilters();
  }

  // --- SORTING LOGIC (Updated to use filteredItems) ---
  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData(column);
  }

  sortData(column: string) {
    // Kita sort filteredItems, bukan items asli
    this.filteredItems.sort((a: any, b: any) => {
      let valueA = a[column];
      let valueB = b[column];

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // --- ADMIN ACTIONS ---
  async saveRealItem() {
    if (!this.newItem.name || !this.newItem.location || this.newItem.stock < 0) {
      alert('Please fill all mandatory fields.'); return;
    }
    this.isSaving = true;
    try {
      await this.db.addItem(this.newItem);
      alert('Item added!');
      this.showForm = false;
      this.newItem = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available', imageUrl: '' };
    } catch (err) { console.error(err); } finally { this.isSaving = false; }
  }

  async deleteItem(id: string | undefined) {
    if (!id) return;
    if (confirm('Delete item?')) await this.db.deleteItem(id);
  }

  // --- STUDENT ACTIONS ---
  openBorrowModal() {
    this.borrowRequest.location = ''; this.borrowRequest.purpose = '';
    this.borrowRequest.startDate = ''; this.borrowRequest.endDate = '';
    this.items.forEach(i => i.requestQty = 0);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async submitBorrow() {
    // Validasi input form
    if (!this.borrowRequest.location || !this.borrowRequest.purpose) { alert('Fill Location & Purpose'); return; }
    if (!this.borrowRequest.startDate || !this.borrowRequest.endDate) { alert('Select Dates'); return; }

    // Cari item dari array items asli (karena filter view tidak boleh membatasi apa yang bisa dipinjam jika user mencari item lain di modal - *Note: Modal pakai list items full*)
    const selectedItems = this.items.filter(i => i.requestQty > 0);

    if (selectedItems.length === 0) { alert('Select Item'); return; }

    const invalidItem = selectedItems.find(i => i.requestQty > i.stock);
    if (invalidItem) { alert(`Exceeds stock for ${invalidItem.name}`); return; }

    this.isSubmitting = true;
    try {
      for (const item of selectedItems) {
        await this.db.borrowItem(
          item, this.borrowRequest.borrowerName, this.borrowRequest.location, item.requestQty,
          this.borrowRequest.startDate, this.borrowRequest.endDate
        );
      }
      alert('Submitted!'); this.closeModal();
    } catch (error) { console.error(error); alert('Failed.'); } finally { this.isSubmitting = false; }
  }
}
