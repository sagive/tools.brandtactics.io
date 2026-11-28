const fs = require('fs');
const path = require('path');

function setupStandalone() {
  const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
  if (!fs.existsSync(standaloneDir)) {
    console.log('[Standalone Optimizer] No standalone directory found, skipping.');
    return;
  }

  // 1. Copy public/ folder into .next/standalone/public
  const publicSrc = path.join(process.cwd(), 'public');
  const publicDest = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    console.log('[Standalone Optimizer] Copying public/ to standalone/public...');
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  // 2. Copy .next/static/ into .next/standalone/.next/static
  const staticSrc = path.join(process.cwd(), '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log('[Standalone Optimizer] Copying .next/static to standalone/.next/static...');
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  // 3. Purge cache and full node_modules if running on SiteGround to reclaim Inodes
  const isSiteGround = process.cwd().includes('.nodeapp');
  if (isSiteGround) {
    console.log('[Standalone Optimizer] SiteGround detected. Purging root node_modules & cache...');
    try {
      fs.rmSync(path.join(process.cwd(), '.next', 'cache'), { recursive: true, force: true });
      fs.rmSync(path.join(process.cwd(), 'node_modules'), { recursive: true, force: true });
      console.log('[Standalone Optimizer] Successfully pruned tens of thousands of Inodes!');
    } catch (err) {
      console.warn('[Standalone Optimizer] Notice during purge:', err.message);
    }
  }
}

setupStandalone();
