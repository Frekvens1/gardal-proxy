import { Routes } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';

const defaultPath = 'dashboard';
export const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: defaultPath},

  {path: 'dashboard', component: DashboardComponent},

  {path: '**', redirectTo: defaultPath},
];
