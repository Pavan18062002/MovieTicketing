import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class SuperAdminLayoutComponent {}
