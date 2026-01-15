import { Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface User { id?: string; name: string; email: string; studentId: string; role: 'Admin' | 'Student'; status: 'active' | 'pending' | 'rejected'; isDeleted?: boolean; password?: string; }
export interface Item { id?: string; name: string; category: string; stock: number; location: string; status: 'Available' | 'Damaged' | 'Lost'; }

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firestore: Firestore) {}

  // --- USER MANAGEMENT ---
  getUserByEmail(email: string): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('email', '==', email)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  registerStudent(user: User) { const usersRef = collection(this.firestore, 'users'); return addDoc(usersRef, { ...user, role: 'Student', status: 'pending', isDeleted: false }); }

  getActiveUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'active'), where('isDeleted', '==', false)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getPendingUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('status', '==', 'pending')); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }
  getDeletedUsers(): Observable<User[]> { const usersRef = collection(this.firestore, 'users'); const q = query(usersRef, where('isDeleted', '==', true)); return collectionData(q, { idField: 'id' }) as Observable<User[]>; }

  approveUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { status: 'active' }); }
  rejectUser(id: string) { return deleteDoc(doc(this.firestore, `users/${id}`)); }
  softDeleteUser(id: string) { return updateDoc(doc(this.firestore, `users/${id}`), { isDeleted: true }); }

  // [FITUR BARU] Recover User (Mengembalikan user yang dihapus)
  recoverUser(id: string) {
    return updateDoc(doc(this.firestore, `users/${id}`), { isDeleted: false });
  }

  // --- ITEM MANAGEMENT ---
  getItems(): Observable<Item[]> { const itemsRef = collection(this.firestore, 'items'); return collectionData(itemsRef, { idField: 'id' }) as Observable<Item[]>; }
  addItem(item: Item) { return addDoc(collection(this.firestore, 'items'), item); }
  deleteItem(id: string) { return deleteDoc(doc(this.firestore, `items/${id}`)); }

  // --- BORROWING ---
  getActiveBorrowings(): Observable<any[]> { const borrowRef = collection(this.firestore, 'borrowings'); return collectionData(borrowRef, { idField: 'id' }); }
  getAllBorrowings(): Observable<any[]> { const borrowRef = collection(this.firestore, 'borrowings'); return collectionData(borrowRef, { idField: 'id' }); }

  async borrowItem(item: Item, borrowerName: string, location: string, qty: number) {
    if (item.stock < qty) throw new Error('Stok tidak cukup!');
    const itemRef = doc(this.firestore, `items/${item.id}`);
    await updateDoc(itemRef, { stock: item.stock - qty });
    const borrowRef = collection(this.firestore, 'borrowings');
    await addDoc(borrowRef, { itemName: item.name, itemId: item.id, borrower: borrowerName, borrowDate: new Date().toISOString(), qty: qty, location: location, status: 'Pending' });
  }

  async approveBorrowRequest(borrowId: string) { const borrowRef = doc(this.firestore, `borrowings/${borrowId}`); await updateDoc(borrowRef, { status: 'Borrowed' }); }

  async rejectBorrowRequest(borrowLog: any) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowLog.id}`);
    await updateDoc(borrowRef, { status: 'Rejected', returnDate: new Date().toISOString() });
  }

  async restoreStock(itemId: string, qtyToAdd: number, currentStock: number) {
     const itemRef = doc(this.firestore, `items/${itemId}`);
     await updateDoc(itemRef, { stock: currentStock + qtyToAdd });
  }

  async returnItem(borrowId: string, itemId: string, qty: number, currentStock: number) {
    const borrowRef = doc(this.firestore, `borrowings/${borrowId}`);
    await updateDoc(borrowRef, { status: 'Returned', returnDate: new Date().toISOString() });
    const itemRef = doc(this.firestore, `items/${itemId}`);
    await updateDoc(itemRef, { stock: currentStock + qty });
  }
}
