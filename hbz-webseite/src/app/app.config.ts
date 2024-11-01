import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const firebaseConfig = {
  apiKey: "AIzaSyAeEAXG9V3WhnFfjb9JFjCkFLxCT6nXjgI",
  authDomain: "hbz-database.firebaseapp.com",
  projectId: "hbz-database",
  storageBucket: "hbz-database.appspot.com",
  messagingSenderId: "578882684723",
  appId: "1:578882684723:web:ac8b893140e57f8b86a046"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()), provideAnimationsAsync(),
  ],
};
