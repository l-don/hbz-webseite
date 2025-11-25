##Project Setup:
- im Root: npm install
- im backend: npm install

## Starten: 
- Server.js ausführen (hbz-webseite\backend> node server.js) 
- dann angular starten (hbz-webseite> npm start)

## Veränderungen Hochladen

Um die webseite nach veränderungen wieder hochzuladen sollte volgendes getan werden:
- cd hbz-webseite\hbz-webseite"
- ng build --configuration production (aktuell bleibt prerender manchmal hängen, dann: ng build --configuration production --no-prerender)
- auf dem server löschen: alte .js, .css, index.html, BEHALTE: .htaccess, sitemap.xml.php, robots.txt.php
- in dist/browser ordner gehen (Filezilla), alles auswählen und hochladen (auf server root) (Einstellungen sollten so sein, dass alle existierenden dateien automatisch überschrieben werden)
- webseite testen

## Hinzufügen von bildern zur tross seite:
 - Bilder in den Ordner "src/assets/gallery-lightbox/[Jahr]" legen
   - In der Datei "src/app/tross/tross.component.ts" die Folgenden zeilen anpassen, sodass das Jahr auf das letzt jahr gesetzt ist und die lenght stimmt:
     - ```typescript
       public years: string[] = Array.from({ length: 19 }, (_, i) => (2025 - i).toString()); // Initialize with years from 2007 to 2025
       public selectedYear: string = '2025';
       ```
   - node generate-image-list.js ausführen
