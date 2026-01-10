import { Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Interface User
export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  studentId: string;
  role: 'Admin' | 'Student';
  status: 'active' | 'pending' | 'rejected';
  isDeleted?: boolean;
}

// Interface Item
export interface User { id?: string; name: string; email: string; studentId: string; role: 'Admin' | 'Student'; status: 'active' | 'pending' | 'rejected'; isDeleted?: boolean; password?: string; }
export interface Item { id?: string; name: string; category: string; stock: number; location: string; status: 'Available' | 'Damaged' | 'Lost'; }

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firestore: Firestore) {}

  // ============================
  // 1. USER MANAGEMENT
  // ============================

  getUserByEmail(email: string): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('email', '==', email)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  registerStudent(user: User) { const usersRef = collection(this.firestore, 'users'); return addDoc(usersRef, { ...user, role: 'Student', status: 'pending', isDeleted: false }); }
  getActiveUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'active'), where('isDeleted', '==', false)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getPendingUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'pending')); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getDeletedUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('isDeleted', '==', true)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  approveUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { status: 'active' }); }
  rejectUser(id: string) { return deleteDoc(doc(this.firestore, `users/${id}`)); }
  softDeleteUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { isDeleted: true }); }

  // ============================
  // 2. ITEM MANAGEMENT
  // ============================

  getItems(): Observable<Item[]> {
    const itemsRef = collection(this.firestore, 'items');
    return collectionData(itemsRef, { idField: 'id' }) as Observable<Item[]>;
  }

  addItem(item: Item) {
    const itemsRef = collection(this.firestore, 'items');
    return addDoc(itemsRef, item);
  }

  deleteItem(id: string) {
    const itemDoc = doc(this.firestore, `items/${id}`);
    return deleteDoc(itemDoc);
  }

  updateItem(id: string, data: any) {
    const itemDoc = doc(this.firestore, `items/${id}`);
    return updateDoc(itemDoc, data);
  }

  // ============================
  // 3. BORROWING SYSTEM
  // ============================

  // Untuk Student: Hanya ambil yang sedang dipinjam
  getActiveBorrowings(): Observable<any[]> {
    const borrowRef = collection(this.firestore, 'borrowings');
    // Kita ambil semua dulu, nanti di filter di komponen agar lebih fleksibel
    return collectionData(borrowRef, { idField: 'id' });
  }

  // Ambil semua data untuk Admin
  getAllBorrowings(): Observable<any[]> {
    const borrowRef = collection(this.firestore, 'borrowings');
    return collectionData(borrowRef, { idField: 'id' });
  }

  // 1. REQUEST PINJAM (Status: PENDING)
  async borrowItem(item: Item, borrowerName: string, location: string, qty: number) {
    if (item.stock < qty) throw new Error('Stok tidak cukup!');

    // Kurangi Stok (Booking barang)
    const itemRef = doc(this.firestore, `items/${item.id}`);
    await updateDoc(itemRef, { stock: item.stock - qty });

    // Buat Log dengan status 'Pending'
    const borrowRef = collection(this.firestore, 'borrowings');
    await addDoc(borrowRef, {
      itemName: item.name,
      itemId: item.id,
      borrower: borrowerName,
      borrowDate: new Date().toISOString(),
      qty: qty,
      location: location,
      status: 'Pending' // <--- PERUBAHAN DISINI
    });
  }

  // 2. ADMIN APPROVE (Ubah status Pending -> Borrowed)
  async approveBorrowRequest(borrowId: string) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowId}`);
    await updateDoc(borrowRef, { status: 'Borrowed' });
  }

  // 3. ADMIN REJECT (Ubah status -> Rejected & KEMBALIKAN STOK)
  async rejectBorrowRequest(borrowLog: any) {
    // Update status
    const borrowRef = doc(this.firestore, `borrowings/${borrowLog.id}`);
    await updateDoc(borrowRef, {
      status: 'Rejected',
      returnDate: new Date().toISOString()
    });

    // Kembalikan Stok karena batal pinjam
    // Kita perlu fetch stok terbaru dulu (simplifikasi: stok saat ini + qty batal)
    // Note: Idealnya pakai transaction, tapi ini cukup untuk demo.
    // Kita asumsikan stok aman.

    // NB: Kita butuh stok item saat ini. Karena di service kita tidak punya cache item,
    // kita akan update dengan increment (fitur firestore) atau fetch manual.
    // Di sini kita pakai cara manual yang aman:
    // (Logic detail ada di component yang memanggil service ini agar bisa pass currentStock)
  }

  // Helper Reject dengan stok
  async restoreStock(itemId: string, qtyToAdd: number, currentStock: number) {
     const itemRef = doc(this.firestore, `items/${itemId}`);
     await updateDoc(itemRef, { stock: currentStock + qtyToAdd });
  }

  // 4. RETURN ITEM (Selesai Pinjam)
  async returnItem(borrowId: string, itemId: string, qty: number, currentStock: number) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowId}`);
    await updateDoc(borrowRef, {
      status: 'Returned',
      returnDate: new Date().toISOString()
    });

    const itemRef = doc(this.firestore, `items/${itemId}`);
    await updateDoc(itemRef, { stock: currentStock + qty });
  }
}
