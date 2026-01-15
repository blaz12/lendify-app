import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ManageItemsComponent } from './pages/manage-items/manage-items.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';
import { BorrowReturnComponent } from './pages/borrow-return/borrow-return.component';
import { ProfileComponent } from './pages/profile/profile.component';
// Import Not Found
import { NotFoundComponent } from './pages/not-found/not-found.component';

import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'items', component: ManageItemsComponent, canActivate: [authGuard] },
  { path: 'borrow-return', component: BorrowReturnComponent, canActivate: [authGuard] },
  { path: 'users', component: ManageUsersComponent, canActivate: [authGuard, adminGuard] },

  // [UPDATE] Ganti redirect login dengan Component 404
  { path: '**', component: NotFoundComponent }
];
