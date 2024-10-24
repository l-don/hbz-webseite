const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/assets/gallery');
const outputPath = path.join(__dirname, 'src/assets/image-list.json');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Fehler beim Lesen des Verzeichnisses: ' + err);
  }

  const images = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  }).map(file => `/assets/gallery/${file}`);

  fs.writeFile(outputPath, JSON.stringify(images), err => {
    if (err) {
      return console.log('Fehler beim Schreiben der Datei: ' + err);
    }
    console.log('Bildliste erfolgreich generiert.');
  });
});
