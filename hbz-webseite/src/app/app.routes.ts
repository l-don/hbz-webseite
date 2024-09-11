import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {MainPageComponent} from "./pages/main-page/main-page.component";
import {VereinPageComponent} from "./pages/verein-page/verein-page.component";
import {TrossPageComponent} from "./pages/tross-page/tross-page.component";
import {AnmeldungPageComponent} from "./pages/anmeldung-page/anmeldung-page.component";
import {NeuigkeitenPageComponent} from "./pages/neuigkeiten-page/neuigkeiten-page.component";
import {SponsorenPageComponent} from "./pages/sponsoren-page/sponsoren-page.component";
import {GaestebuchPageComponent} from "./pages/gaestebuch-page/gaestebuch-page.component";
import {EinblickePageComponent} from "./pages/einblicke-page/einblicke-page.component";
import {NeusiedlerPageComponent} from "./pages/neusiedler-page/neusiedler-page.component";

export const routes: Routes = [
  { path: 'main', component: MainPageComponent },
  { path: 'verein', component: VereinPageComponent },
  { path: 'tross', component: TrossPageComponent },
  { path: 'anmeldung', component: AnmeldungPageComponent },
  { path: 'neuigkeiten', component: NeuigkeitenPageComponent },
  { path: 'sponsoren', component: SponsorenPageComponent },
  { path: 'gästebuch', component: GaestebuchPageComponent },
  { path: 'einblicke', component: EinblickePageComponent },
  { path: 'neusiedler', component: NeusiedlerPageComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
