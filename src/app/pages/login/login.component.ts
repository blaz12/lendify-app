import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatabaseService, User } from '../../services/database.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  // State
  isRegisterMode: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Data Model Login
  loginData = { email: '', password: '' };

  // Data Model Register
  registerData: User = {
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'Student',
    status: 'pending', // Default pending
    isDeleted: false
  };

  constructor(private db: DatabaseService, private router: Router) {}

  // --- LOGIKA LOGIN ---
  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';

    if(!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.isLoading = true;

    this.db.getUserByEmail(this.loginData.email).subscribe({
      next: (users) => {
        this.isLoading = false;

        if (users.length > 0) {
          const user = users[0];

          // 1. Cek Password (Simpel)
          if (user.password !== this.loginData.password) {
            this.errorMessage = 'Incorrect password.';
            return;
          }

          // 2. Cek Status Approval
          if (user.status === 'pending') {
            this.errorMessage = 'Account under review. Please wait for Admin approval.';
            return;
          }

          // 3. Cek apakah akun dihapus
          if (user.isDeleted) {
             this.errorMessage = 'Account has been deactivated.';
             return;
          }

          // LOGIN SUKSES
          localStorage.setItem('demoRole', user.role.toLowerCase());
          localStorage.setItem('userName', user.name);
          this.router.navigate(['/dashboard']);

        } else {
          this.errorMessage = 'Email not found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Connection error.';
        console.error(err);
      }
    });
  }

  // --- LOGIKA REGISTER ---
  async onRegister() {
    // Validasi
    if(!this.registerData.name || !this.registerData.email || !this.registerData.studentId || !this.registerData.password) {
      this.errorMessage = 'Please fill all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.db.registerStudent(this.registerData);

      this.successMessage = 'Registration successful! Wait for Admin verification.';
      this.isRegisterMode = false; // Kembali ke tampilan login

      // Reset Form
      this.registerData = {
        name: '', email: '', password: '', studentId: '',
        role: 'Student', status: 'pending', isDeleted: false
      };

    } catch (err) {
      this.errorMessage = 'Registration failed. Try again.';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }
}
