const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', '.open-next');
const routesPath = path.join(outDir, '_routes.json');

if (!fs.existsSync(outDir)) {
  console.error('[inject-routes] Output directory not found:', outDir);
  process.exit(0);
}

const routes = {
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*', '/_next/*', '/favicon.ico', '/robots.txt']
};

fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
console.log('[inject-routes] Written', routesPath);


