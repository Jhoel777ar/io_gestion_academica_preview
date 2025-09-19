import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs/docente',
    loadComponent: () => import('./docente/docente.page').then(m => m.DocentePage),
  },
  {
    path: 'tabs/estudiante',
    loadComponent: () => import('./estudiante/estudiante.page').then(m => m.EstudiantePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];