import { Routes } from '@angular/router';
import { SuperAdminLayoutComponent } from './super-admin-layout.component';
import { UserManagementComponent } from './user-management/user-management.component';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SuperAdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent }
    ]
  }
];
