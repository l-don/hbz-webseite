const fs = require('fs');
const path = require('path');

const galleryPath = path.join(__dirname, 'src/assets/gallery-lightbox');
const outputPath = path.join(__dirname, 'src/assets/image-list.json');

let years = {};

fs.readdir(galleryPath, (err, yearDirs) => {
  if (err) {
    return console.log('Fehler beim Lesen des Verzeichnisses: ' + err);
  }

  // Nur Verzeichnisse der Jahre filtern
  yearDirs = yearDirs.filter(yearDir => {
    return fs.statSync(path.join(galleryPath, yearDir)).isDirectory();
  });

  yearDirs.forEach(yearDir => {
    const yearPath = path.join(galleryPath, yearDir);
    const files = fs.readdirSync(yearPath);

    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    }).map(file => `assets/gallery-lightbox/${yearDir}/${file}`);

    years[yearDir] = images;
  });

  fs.writeFile(outputPath, JSON.stringify(years), err => {
    if (err) {
      return console.log('Fehler beim Schreiben der Datei: ' + err);
    }
    console.log('Bildliste erfolgreich generiert.');
  });
});
