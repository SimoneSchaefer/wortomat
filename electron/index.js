// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
const log = require('electron-log');

log.info('Starting wortomat');

let mainWindow;
let serverProcess;

const createWindow = () => {
    log.info('creating window');

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 868
    })


    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    const devMode = process.argv.find(arg => arg === '--dev');
    log.debug('using dev mode: ' + devMode);
    if (devMode) {
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.removeMenu();
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    let filename = path.join(__dirname, 'jar/wortomat.jar')
    log.info('loading jar file: ' + filename)
    try {
        serverProcess = require('child_process').spawn('java', ['-jar'].concat(filename));
        serverProcess.stdout.on('data', (data) => {
            log.info(`stdout: ${data}`);
            if (data.includes('Started WortomatApplication in')) {
                log.info('Finished loading application')
                mainWindow.loadURL('http://localhost:8085');
            } else if (data.includes('APPLICATION FAILED TO START')) {
                log.error('Could not start wortomat application');
                mainWindow.loadFile('error.html')
            }
        });
    } catch (e) {
        log.error('Could not start wortomat application');
        mainWindow.loadFile('error.html')
    }

    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
    serverProcess.stdin.pause();
    serverProcess.kill();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.