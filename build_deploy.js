const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const deployDir = path.join(__dirname, 'deploy');

console.log('🚀 Starting deployment preparation...');

// 1. Build Client
console.log('\n📦 Building React Client...');
try {
  console.log('  -> Installing client dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  console.log('  -> Running vite build...');
  execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  console.log('✅ Client built successfully.');
} catch (error) {
  console.error('❌ Failed to build client.');
  process.exit(1);
}

// 2. Prepare Deploy Folder
console.log('\n📁 Preparing deploy folder...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

// Function to copy a directory recursively (ignoring node_modules)
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue; // Skip node_modules and .git
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 3. Copy necessary files
console.log('  -> Copying server files...');
copyDirectory(path.join(__dirname, 'server'), path.join(deployDir, 'server'));

console.log('  -> Copying built client files...');
const clientDistDest = path.join(deployDir, 'client', 'dist');
fs.mkdirSync(path.join(deployDir, 'client'), { recursive: true });
copyDirectory(path.join(__dirname, 'client', 'dist'), clientDistDest);

console.log('  -> Copying and modifying package.json...');
const packageJsonSrc = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonSrc)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonSrc, 'utf8'));
  
  // Create a production-only package.json
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    main: pkg.main,
    scripts: {
      "start": "node index.js"
      // Removed build, dev, etc. to prevent Hostinger from getting confused
    },
    dependencies: pkg.dependencies
  };
  
  fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(prodPkg, null, 2));
}

console.log('  -> Copying other root files...');
const filesToCopy = ['package-lock.json', 'index.js', '.env'];
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, file));
  }
});

// 4. Automatically ZIP the deployment folder
console.log('\n🗜️ Zipping deployment package...');
const zipFile = path.join(__dirname, 'hostinger-deploy.zip');
if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

try {
  // Use PowerShell to compress the contents of the deploy folder
  const psCommand = `powershell.exe -NoProfile -NonInteractive -Command "Compress-Archive -Path '.\\deploy\\*' -DestinationPath '.\\hostinger-deploy.zip' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });
  console.log('✅ Created hostinger-deploy.zip');
} catch (error) {
  console.error('⚠️ Could not automatically create zip. You will need to zip the contents of the "deploy" folder manually.');
}

console.log('\n🎉 Deployment package is ready!');
console.log('\n======================================================');
console.log('👉 FINAL STEPS FOR HOSTINGER:');
if (fs.existsSync(zipFile)) {
  console.log('1. Go to your Hostinger deployment screen.');
  console.log('2. UPLOAD the file named: "hostinger-deploy.zip"');
  console.log('   (It is located right here in your project root folder.)');
} else {
  console.log('1. Open your File Explorer and go into the "deploy" folder inside this project.');
  console.log('2. Select ALL files inside the "deploy" folder.');
  console.log('3. Right-click the selected files -> "Compress to ZIP file".');
  console.log('4. Upload THAT newly created ZIP file to Hostinger.');
}
console.log('======================================================\n');
