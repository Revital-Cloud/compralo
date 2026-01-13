// #region agent log
const fs = require('fs');
const path = require('path');

const logData = {
  location: 'check-ui-package.js',
  timestamp: Date.now(),
  sessionId: 'debug-session',
  runId: 'run1'
};

// Check if package exists in node_modules
const nodeModulesPath = path.resolve(__dirname, '../node_modules/@repo/ui');
const nodeModulesPackageJson = path.join(nodeModulesPath, 'package.json');
const nodeModulesIndex = path.join(nodeModulesPath, 'src/index.ts');

// Check workspace path
const workspacePath = path.resolve(__dirname, '../../../packages/ui');
const workspacePackageJson = path.join(workspacePath, 'package.json');
const workspaceIndex = path.join(workspacePath, 'src/index.ts');

const checks = {
  nodeModulesExists: fs.existsSync(nodeModulesPath),
  nodeModulesPackageJsonExists: fs.existsSync(nodeModulesPackageJson),
  nodeModulesIndexExists: fs.existsSync(nodeModulesIndex),
  workspaceExists: fs.existsSync(workspacePath),
  workspacePackageJsonExists: fs.existsSync(workspacePackageJson),
  workspaceIndexExists: fs.existsSync(workspaceIndex),
  nodeModulesPath,
  workspacePath,
  cwd: process.cwd()
};

if (checks.nodeModulesPackageJsonExists) {
  const pkg = JSON.parse(fs.readFileSync(nodeModulesPackageJson, 'utf8'));
  checks.packageJson = {
    name: pkg.name,
    main: pkg.main,
    types: pkg.types,
    exports: pkg.exports
  };
}

logData.message = 'Package check results';
logData.data = checks;
logData.hypothesisId = 'A';

fetch('http://localhost:7242/ingest/8563cde2-2ec0-499b-8f8c-ff380c85ad70', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(logData)
}).catch(() => {});

console.log('Package check results:', JSON.stringify(checks, null, 2));
// #endregion

