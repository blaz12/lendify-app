import { Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface User { id?: string; name: string; email: string; studentId: string; role: 'Admin' | 'Student'; status: 'active' | 'pending' | 'rejected'; isDeleted?: boolean; password?: string; }
export interface Item { id?: string; name: string; category: string; stock: number; location: string; status: 'Available' | 'Damaged' | 'Lost'; imageUrl?: string; }

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firestore: Firestore) {}

  // --- USER ---
  getUserByEmail(email: string): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('email', '==', email)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  registerStudent(user: User) { const usersRef = collection(this.firestore, 'users'); return addDoc(usersRef, { ...user, role: 'Student', status: 'pending', isDeleted: false }); }
  getActiveUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'active'), where('isDeleted', '==', false)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getPendingUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'pending')); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getDeletedUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('isDeleted', '==', true)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  approveUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { status: 'active' }); }
  rejectUser(id: string) { return deleteDoc(doc(this.firestore, `users/${id}`)); }
  recoverUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { isDeleted: false }); }
  softDeleteUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { isDeleted: true }); }

  // --- ITEM ---
  getItems(): Observable<Item[]> { const itemsRef = collection(this.firestore, 'items'); return collectionData(itemsRef, { idField: 'id' }) as Observable<Item[]>; }
  addItem(item: Item) { return addDoc(collection(this.firestore, 'items'), item); }
  deleteItem(id: string) { return deleteDoc(doc(this.firestore, `items/${id}`)); }

  // --- BORROWING ---
  getActiveBorrowings(): Observable<any[]> { const borrowRef = collection(this.firestore, 'borrowings'); return collectionData(borrowRef, { idField: 'id' }); }
  getAllBorrowings(): Observable<any[]> { const borrowRef = collection(this.firestore, 'borrowings'); return collectionData(borrowRef, { idField: 'id' }); }

  async borrowItem(item: Item, borrowerName: string, location: string, qty: number, startDate: string, endDate: string) {
    if (item.stock < qty) throw new Error('Stok tidak cukup!');
    const itemRef = doc(this.firestore, `items/${item.id}`);
    await updateDoc(itemRef, { stock: item.stock - qty });
    const borrowRef = collection(this.firestore, 'borrowings');
    await addDoc(borrowRef, {
      itemName: item.name, itemId: item.id, borrower: borrowerName,
      requestDate: new Date().toISOString(), borrowDate: startDate, dueDate: endDate,
      qty: qty, location: location, status: 'Pending'
    });
  }

  async approveBorrowRequest(borrowId: string) { const borrowRef = doc(this.firestore, `borrowings/${borrowId}`); await updateDoc(borrowRef, { status: 'Borrowed' }); }

  async rejectBorrowRequest(borrowLog: any) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowLog.id}`);
    // Update status jadi Rejected
    await updateDoc(borrowRef, { status: 'Rejected', returnDate: new Date().toISOString() });
    // Kembalikan stok (PENTING: Kita perlu ambil stok saat ini dulu di component, lalu panggil restoreStock)
  }

  async restoreStock(itemId: string, qtyToAdd: number, currentStock: number) {
     const itemRef = doc(this.firestore, `items/${itemId}`);
     await updateDoc(itemRef, { stock: currentStock + qtyToAdd });
  }

  // [UPDATE] Tambah Parameter Condition
  async returnItem(borrowId: string, itemId: string, qty: number, currentStock: number, condition: string) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowId}`);

    // Update Log
    await updateDoc(borrowRef, {
      status: 'Returned',
      returnDate: new Date().toISOString(),
      returnCondition: condition // Simpan kondisi (Good/Damaged/Lost)
    });

    // Update Stock (Hanya jika kondisi Good atau Damaged, jika Lost mungkin stok hilang permanen?)
    // Untuk simplifikasi sistem ini: Kita anggap stok selalu kembali, nanti Admin delete item manual jika Lost.
    const itemRef = doc(this.firestore, `items/${itemId}`);
    await updateDoc(itemRef, { stock: currentStock + qty });
  }
}
