import { Routes } from '@angular/router';
// Kita akan buat komponen ini nanti, biarkan error dulu atau comment sementara
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BorrowReturnComponent } from './pages/borrow-return/borrow-return.component';
import { ManageItemsComponent } from './pages/manage-items/manage-items.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'borrow-return', component: BorrowReturnComponent },
  { path: 'items', component: ManageItemsComponent },
  { path: 'users', component: ManageUsersComponent },
];
