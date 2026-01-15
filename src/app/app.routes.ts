import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ManageItemsComponent } from './pages/manage-items/manage-items.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';
import { BorrowReturnComponent } from './pages/borrow-return/borrow-return.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Import Guard yang baru dibuat
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // --- HALAMAN YANG PERLU LOGIN (AuthGuard) ---
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // --- HALAMAN KHUSUS ADMIN (AdminGuard) ---
  // Student tidak boleh masuk sini
  {
    path: 'users',
    component: ManageUsersComponent,
    canActivate: [authGuard, adminGuard]
  },

  // --- HALAMAN CAMPURAN (Tapi perlu Login) ---
  // Logic Admin/Student sudah dihandle di dalam komponen (ngIf)
  // Tapi tetap harus login dulu
  {
    path: 'items',
    component: ManageItemsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'borrow-return',
    component: BorrowReturnComponent,
    canActivate: [authGuard]
  },

  // Wildcard (Jika user ketik url ngawur)
  { path: '**', redirectTo: 'login' }
];
