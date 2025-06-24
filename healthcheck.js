const http = require('http');
const { execSync } = require('child_process');

// Configuration
const PORT = process.env.APP_PORT || 3000;
const HOST = 'localhost';  // Use '0.0.0.0' if checking from outside container
const TIMEOUT = 5000;     // 5 seconds timeout

// Option 1: HTTP Health Check (recommended)
function checkHttpHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/health',
      method: 'GET',
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

// Option 2: Database Connection Check (if applicable)
function checkDatabase() {
  try {
    // Example for MongoDB
    execSync('mongosh --eval "db.stats()"', { timeout: TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

// Main check
async function main() {
  const httpHealthy = await checkHttpHealth();
  const dbHealthy = true; // Set to checkDatabase() if using DB

  if (!httpHealthy) {
    console.error('HTTP Health Check Failed');
    process.exit(1);
  }

  if (!dbHealthy) {
    console.error('Database Connection Failed');
    process.exit(1);
  }

  console.log('Health Check Passed');
  process.exit(0);
}

main();