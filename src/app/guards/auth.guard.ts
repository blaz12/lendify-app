import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

// 1. Guard untuk memastikan User sudah Login
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('demoRole');

  if (role) {
    return true; // Boleh masuk
  } else {
    router.navigate(['/login']); // Tendang ke login
    return false;
  }
};

// 2. Guard KHUSUS ADMIN (Student dilarang masuk)
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('demoRole');

  if (role === 'admin') {
    return true; // Silakan masuk bos
  } else {
    alert('Access Denied: Admins only!'); // Peringatan
    router.navigate(['/dashboard']); // Kembalikan ke dashboard
    return false;
  }
};
