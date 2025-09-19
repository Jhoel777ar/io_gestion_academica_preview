import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading, PreloadAllModules, RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

import { addIcons } from 'ionicons';
import {
  schoolOutline,
  mailOutline,
  lockClosedOutline,
  logInOutline,
  personOutline,
  personAddOutline,
  eyeOutline,
  eyeOffOutline,
  calendarOutline,
  libraryOutline,
} from 'ionicons/icons';

addIcons({
  'school-outline': schoolOutline,
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
  'log-in-outline': logInOutline,
  'person-outline': personOutline,
  'person-add-outline': personAddOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'calendar-outline': calendarOutline,
  'library-outline': libraryOutline,
});

(async () => {
  const storage = new Storage();
  await storage.create();

  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(routes, withPreloading(PreloadAllModules)),
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      { provide: Storage, useValue: storage },
    ],
  });
})();
