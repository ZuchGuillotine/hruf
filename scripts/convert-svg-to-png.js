import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to public directory
const publicDir = path.join(__dirname, '..', 'client', 'public');

// Convert badge icon
sharp(path.join(publicDir, 'badge-icon.svg'))
  .png()
  .toFile(path.join(publicDir, 'badge-icon.png'))
  .then(() => {
    console.log('Successfully converted badge-icon.svg to PNG');
  })
  .catch(err => {
    console.error('Error converting badge-icon.svg:', err);
  });

// Convert logo192
sharp(path.join(publicDir, 'logo192.svg'))
  .png()
  .toFile(path.join(publicDir, 'logo192.png'))
  .then(() => {
    console.log('Successfully converted logo192.svg to PNG');
  })
  .catch(err => {
    console.error('Error converting logo192.svg:', err);
  });