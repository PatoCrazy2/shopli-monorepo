import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, '../public/shopli.svg');
const icon192Path = path.resolve(__dirname, '../public/pwa-192x192.png');
const icon512Path = path.resolve(__dirname, '../public/pwa-512x512.png');

async function generateIcons() {
  console.log('Generando iconos PWA desde:', svgPath);

  // Generar 192x192 PNG
  await sharp(svgPath)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(icon192Path);
  console.log('✔ Icono 192x192 generado en:', icon192Path);

  // Generar 512x512 PNG
  await sharp(svgPath)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(icon512Path);
  console.log('✔ Icono 512x512 generado en:', icon512Path);
}

generateIcons().catch((err) => {
  console.error('Error generando iconos:', err);
  process.exit(1);
});
