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

  items: BorrowItem[] = [];        // Data Mentah
  filteredItems: BorrowItem[] = []; // Data Tampil
  userRole: string = 'admin';

  // --- ADMIN STATE ---
  showForm: boolean = false;
  isSaving: boolean = false;
  editId: string | null = null; // [BARU] Untuk melacak ID yang sedang diedit

  newItem: Item = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available', imageUrl: '' };

  // --- STUDENT STATE ---
  isModalOpen: boolean = false;
  isSubmitting: boolean = false;
  borrowRequest = { location: '', purpose: '', borrowerName: '', startDate: '', endDate: '' };
  minDate: string = '';

  // --- FILTER & SORT STATE ---
  searchTerm: string = '';
  selectedCategory: string = 'All';
  categories: string[] = ['Laptop', 'Camera', 'Audio', 'Projector', 'Accessory', 'Other'];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('demoRole') || 'admin';
    this.borrowRequest.borrowerName = localStorage.getItem('userName') || 'Student';
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.db.getItems().subscribe(data => {
      console.log('Data dari Firebase:', data);
      // Mapping ke BorrowItem (tambah requestQty)
      this.items = data.map(i => ({ ...i, requestQty: 0 } as BorrowItem));
      this.applyFilters(); // Apply filter awal
    });
  }

  // --- LOGIC FILTER & SORT (TIDAK BERUBAH) ---
  applyFilters() {
    let tempItems = [...this.items];

    if (this.selectedCategory !== 'All') {
      tempItems = tempItems.filter(i => i.category === this.selectedCategory);
    }
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      tempItems = tempItems.filter(i => i.name.toLowerCase().includes(term));
    }

    this.filteredItems = tempItems;
    if (this.sortColumn) this.sortData(this.sortColumn);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.applyFilters();
  }

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

  // --- ADMIN ACTIONS (UPDATED) ---

  // 1. Open Add (Reset Form)
  openAddModal() {
    this.editId = null; // Pastikan mode Add
    this.newItem = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available', imageUrl: '' };
    this.showForm = true;
  }

  // 2. Open Edit (Load Data)
  openEditModal(item: Item) {
    this.editId = item.id!; // Simpan ID
    this.newItem = { ...item }; // Copy data ke form
    this.showForm = true;
  }

  // 3. Save Logic (Add or Update)
  async saveRealItem() {
    if (!this.newItem.name || !this.newItem.location || this.newItem.stock < 0) {
      alert('Please fill all mandatory fields.'); return;
    }
    this.isSaving = true;
    try {
      if (this.editId) {
        // [BARU] Logic Update
        await this.db.updateItem(this.editId, this.newItem);
        alert('Item updated successfully!');
      } else {
        // Logic Add Lama
        await this.db.addItem(this.newItem);
        alert('Item added successfully!');
      }
      this.showForm = false;
      this.editId = null; // Reset
      this.newItem = { name: '', category: 'Laptop', stock: 0, location: '', status: 'Available', imageUrl: '' };
    } catch (err) {
      console.error(err);
      alert('Error saving item');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteItem(id: string | undefined) {
    if (!id) return;
    if (confirm('Delete item?')) await this.db.deleteItem(id);
  }

  // --- STUDENT ACTIONS (TIDAK BERUBAH - LOOPING) ---
  openBorrowModal() {
    this.borrowRequest.location = ''; this.borrowRequest.purpose = '';
    this.borrowRequest.startDate = ''; this.borrowRequest.endDate = '';
    this.items.forEach(i => i.requestQty = 0);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async submitBorrow() {
    if (!this.borrowRequest.location || !this.borrowRequest.purpose) { alert('Fill Location & Purpose'); return; }
    if (!this.borrowRequest.startDate || !this.borrowRequest.endDate) { alert('Select Dates'); return; }

    const selectedItems = this.items.filter(i => i.requestQty > 0);
    if (selectedItems.length === 0) { alert('Select Item'); return; }

    const invalidItem = selectedItems.find(i => i.requestQty > i.stock);
    if (invalidItem) { alert(`Exceeds stock for ${invalidItem.name}`); return; }

    this.isSubmitting = true;
    try {
      // Loop dan panggil borrowItem satu per satu
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
