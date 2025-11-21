const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
// __dirname apunta a scripts/, así que subimos un nivel para llegar a la raíz
const backendPath = path.resolve(__dirname, '..', 'apps', 'ecommerce', 'backend');

// Determinar el comando según el sistema operativo
let command;
let args;

const fs = require('fs');

if (isWindows) {
  // En Windows, usar Python del venv directamente con -m fastapi
  const venvPython = path.join(backendPath, 'venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPython)) {
    command = venvPython;
    args = ['-m', 'fastapi', 'dev', 'app/main.py'];
  } else {
    // Si no hay venv, intentar con python global
    command = 'python';
    args = ['-m', 'fastapi', 'dev', 'app/main.py'];
  }
} else {
  // En Linux/Mac
  const venvPython = path.join(backendPath, 'venv', 'bin', 'python');
  
  if (fs.existsSync(venvPython)) {
    command = venvPython;
    args = ['-m', 'fastapi', 'dev', 'app/main.py'];
  } else {
    command = 'python3';
    args = ['-m', 'fastapi', 'dev', 'app/main.py'];
  }
}

// Cambiar al directorio del backend
process.chdir(backendPath);

console.log(`🚀 Iniciando backend de ecommerce...`);
console.log(`📁 Directorio: ${backendPath}`);
console.log(`⚙️  Comando: ${command} ${args.join(' ')}`);

// En Windows, cuando usamos shell: true, si la ruta tiene espacios necesitamos entrecomillarla
// La mejor forma es pasar todo como un string cuando hay espacios
let spawnCommand = command;
let spawnArgs = args;
const spawnOptions = {
  stdio: 'inherit',
  cwd: backendPath,
  shell: isWindows
};

if (isWindows && command.includes(' ')) {
  // Si la ruta tiene espacios, entrecomillarla y pasar todo como string
  spawnCommand = `"${command}" ${args.join(' ')}`;
  spawnArgs = [];
}

const child = spawn(spawnCommand, spawnArgs, spawnOptions);

child.on('error', (error) => {
  console.error(`❌ Error al ejecutar el backend: ${error.message}`);
  console.error(`💡 Asegúrate de que FastAPI esté instalado en el entorno virtual.`);
  console.error(`📝 Ejecuta: cd apps/ecommerce/backend && python -m venv venv && .\\venv\\Scripts\\activate && pip install -r requirements.txt`);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ El backend se cerró con código ${code}`);
    process.exit(code);
  }
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});

