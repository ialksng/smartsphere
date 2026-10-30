import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const targetSubdir = path.join(distDir, 'work', 'projects', 'smartsphere', 'app');

try {
  // Ensure target nested directory exists
  fs.mkdirSync(targetSubdir, { recursive: true });

  // Copy assets folder into nested subpath so requests to /work/projects/smartsphere/app/assets/* find physical files
  const assetsDir = path.join(distDir, 'assets');
  const targetAssetsDir = path.join(targetSubdir, 'assets');

  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, targetAssetsDir, { recursive: true });
    console.log('✅ Mirrored assets to /work/projects/smartsphere/app/assets');
  }

  // Copy index.html into nested subpath
  const indexHtml = path.join(distDir, 'index.html');
  const targetIndexHtml = path.join(targetSubdir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, targetIndexHtml);
    console.log('✅ Mirrored index.html to /work/projects/smartsphere/app/index.html');
  }
} catch (err) {
  console.error('Error copying assets:', err);
}

