const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let installPath;

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>MDT Installer</title>
<style>
  body { font-family: Arial; background: #121212; color: #eee; padding: 20px; max-width: 600px; margin: auto; }
  button { margin-top: 10px; padding: 10px 20px; cursor: pointer; }
  textarea { width: 100%; height: 300px; background: #222; color: #ddd; border: none; padding: 10px; }
  .hidden { display: none; }
  input { width: 100%; margin-top: 10px; padding: 8px; }
</style>
</head>
<body>
  <h1>MDT Installer</h1>
  <div id="tos-section">
    <h2>Terms of Service</h2>
    <textarea readonly>
By using this software, you agree to all terms and conditions. Do not redistribute or reverse engineer.
    </textarea>
    <button id="accept-tos-btn">I Accept</button>
  </div>
  <div id="install-section" class="hidden">
    <h2>Select Install Folder</h2>
    <button id="choose-folder-btn">Choose Folder</button>
    <p id="chosen-path"></p>
    <button id="install-btn" disabled>Install</button>
    <p id="install-status"></p>
  </div>
  <div id="login-section" class="hidden">
    <h2>Login</h2>
    <input id="username" placeholder="Username" />
    <input id="password" placeholder="Password" type="password" />
    <button id="login-btn">Login</button>
    <p id="login-status"></p>
  </div>
  <div id="dashboard-section" class="hidden">
    <h2>MDT Dashboard</h2>
    <p>Welcome! This is your MDT system.</p>
  </div>
<script>
  const { ipcRenderer } = require('electron');
  const tosSection = document.getElementById('tos-section');
  const installSection = document.getElementById('install-section');
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  document.getElementById('accept-tos-btn').onclick = () => {
    tosSection.classList.add('hidden');
    installSection.classList.remove('hidden');
  };
  document.getElementById('choose-folder-btn').onclick = async () => {
    const selectedPath = await ipcRenderer.invoke('select-install-path');
    if (selectedPath) {
      document.getElementById('chosen-path').textContent = selectedPath;
      document.getElementById('install-btn').disabled = false;
    }
  };
  document.getElementById('install-btn').onclick = async () => {
    document.getElementById('install-status').textContent = 'Installing...';
    const files = [
      { name: 'config/config.ini', content: '[database]\nhost=localhost\nuser=root\npassword=yourpassword\ndatabase=mdt_system\n' },
      { name: 'sql/schema.sql', content: 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), password VARCHAR(50));' },
      { name: 'resources/fivem-mdt/client.lua', content: '-- Lua Client' },
      { name: 'resources/fivem-mdt/server.lua', content: '-- Lua Server' },
      { name: 'resources/fivem-mdt/html/index.html', content: '<html><body>MDT UI</body></html>' }
    ];
    const result = await ipcRenderer.invoke('install-files', files);
    if (result === true) {
      document.getElementById('install-status').textContent = 'Installed successfully!';
      installSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
    } else {
      document.getElementById('install-status').textContent = 'Error: ' + result;
    }
  };
  document.getElementById('login-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if(user === 'admin' && pass === 'password') {
      loginSection.classList.add('hidden');
      dashboardSection.classList.remove('hidden');
    } else {
      document.getElementById('login-status').textContent = 'Invalid username or password';
    }
  };
</script>
</body>
</html>
`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent));
}

app.whenReady().then(() => {
  createWindow();
  ipcMain.handle('select-install-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      installPath = result.filePaths[0];
      return installPath;
    }
    return null;
  });
  ipcMain.handle('install-files', async (event, files) => {
    try {
      if (!installPath) throw new Error('Install path not selected');
      for (const file of files) {
        const fullPath = path.join(installPath, file.name);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, file.content, 'utf8');
      }
      return true;
    } catch (error) {
      return error.message;
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
