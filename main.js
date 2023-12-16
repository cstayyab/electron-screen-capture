const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('get-screenshot-source', (event) => {
  getScreenshotSource();
});

ipcMain.on('save-screenshot', (event, dataUri) => {
  saveScreenshot(dataUri);
});

function getScreenshotSource() {
  desktopCapturer.getSources({ types: ['screen'] }).then(async sources => {
    for (const source of sources) {
      if (source.name.toLowerCase() === 'entire screen' || source.name === 'screen 1') {
        mainWindow.webContents.send('screenshot-source', source.id);
        return;
      }
    }
  });
}

function saveScreenshot(dataUri) {
  // Save dataUri to file
  console.log("Saving screenshot");
  const base64Data = dataUri.replace(/^data:image\/png;base64,/, "");
  fs.writeFile("screenshot.png", base64Data, 'base64', (err) => {
    if (err) {
      console.log(err);
    } else {
      mainWindow.webContents.send('screenshot-saved', path.join(__dirname, 'screenshot.png'));
      console.log("Screenshot saved");
    }
  });
}

