import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(), provideAnimationsAsync(), provideFirebaseApp(() => initializeApp({"projectId":"hbz-database","appId":"1:578882684723:web:0765987b50f1bf8a86a046","storageBucket":"hbz-database.appspot.com","apiKey":"AIzaSyAeEAXG9V3WhnFfjb9JFjCkFLxCT6nXjgI","authDomain":"hbz-database.firebaseapp.com","messagingSenderId":"578882684723"})), provideFirestore(() => getFirestore())]
};
