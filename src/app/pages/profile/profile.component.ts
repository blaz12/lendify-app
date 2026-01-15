import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DatabaseService, User } from '../../services/database.service';
import { doc, updateDoc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: any = {};
  isLoading: boolean = false;
  isSaving: boolean = false;

  // Form Model
  editData = {
    name: '',
    email: '', // Read only
    studentId: '', // Read only
    password: '', // New Password
    confirmPassword: ''
  };

  constructor(private db: DatabaseService, private firestore: Firestore) {}

  ngOnInit() {
    const email = localStorage.getItem('userEmail'); // Kita butuh simpan email saat login
    if(email) {
      this.db.getUserByEmail(email).subscribe(users => {
        if(users.length > 0) {
          this.user = users[0];
          // Isi Form
          this.editData.name = this.user.name;
          this.editData.email = this.user.email;
          this.editData.studentId = this.user.studentId || '-';
        }
      });
    }
  }

  async saveProfile() {
    if(!this.editData.name) return alert('Name is required');

    // Validasi Password (Jika diisi)
    if(this.editData.password) {
        if(this.editData.password !== this.editData.confirmPassword) {
            return alert('Password confirmation does not match!');
        }
    }

    this.isSaving = true;

    try {
        const userRef = doc(this.firestore, `users/${this.user.id}`);

        // Siapkan data update
        const updatePayload: any = { name: this.editData.name };

        // Jika password diisi, update password
        if(this.editData.password) {
            updatePayload.password = this.editData.password;
        }

        await updateDoc(userRef, updatePayload);

        // Update Local Storage agar nama di sidebar berubah live
        localStorage.setItem('userName', this.editData.name);

        alert('Profile updated successfully!');
        this.editData.password = ''; // Reset field password
        this.editData.confirmPassword = '';

    } catch(e) {
        console.error(e);
        alert('Failed to update profile');
    } finally {
        this.isSaving = false;
    }
  }
}
