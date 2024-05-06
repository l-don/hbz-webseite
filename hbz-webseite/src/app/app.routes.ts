import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {MainPageComponent} from "./main-page/main-page.component";
import {VereinPageComponent} from "./verein-page/verein-page.component";
import {TrossPageComponent} from "./tross-page/tross-page.component";

export const routes: Routes = [
  { path: 'main', component: MainPageComponent },
  { path: 'verein', component: VereinPageComponent },
  { path: 'tross', component: TrossPageComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
