const fs = require('fs');
const path = require('path');

function cleanupOldDeployments() {
  try {
    // In SiteGround, the structure during build is:
    // .../public_html/.nodeapp/<current_deployment_hash>/app_source
    const appSourceDir = process.cwd();
    const currentDeployDir = path.resolve(appSourceDir, '..');
    const nodeAppDir = path.resolve(currentDeployDir, '..');

    const baseName = path.basename(nodeAppDir).toLowerCase();
    if (!baseName.includes('nodeapp')) {
      return; // Skip when running outside SiteGround
    }

    console.log(`[SiteGround Anti-Bloat] Scanning: ${nodeAppDir}`);
    const currentDeployName = path.basename(currentDeployDir);

    const entries = fs.readdirSync(nodeAppDir, { withFileTypes: true });
    let deletedCount = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const folderName = entry.name;
      // Match SiteGround timestamped releases and initial clone
      const isReleaseFolder = /^\d+-[a-zA-Z0-9]+$/.test(folderName) || folderName === '1234567890-origin';

      if (isReleaseFolder && folderName !== currentDeployName) {
        const targetPath = path.join(nodeAppDir, folderName);
        console.log(`[SiteGround Anti-Bloat] Purging obsolete deployment: ${folderName}`);
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
          deletedCount++;
        } catch (err) {
          console.warn(`[SiteGround Anti-Bloat] Notice: Could not remove ${folderName}: ${err.message}`);
        }
      }
    }
    console.log(`[SiteGround Anti-Bloat] Finished. Purged ${deletedCount} obsolete releases.`);
  } catch (err) {
    console.warn('[SiteGround Anti-Bloat] Cleanup skipped:', err.message);
  }
}

cleanupOldDeployments();
