// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import createWindow from './helpers/window';
import logger from './helpers/logger.js';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

let mainWindow, progressWindow, showProgressTimeout;

logger.init('main');
logger.info(`Using arch ${process.arch}`);

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
    let userDataPath = app.getPath('userData');
    app.setPath('userData', `${userDataPath} (${env.name})`);
}

let getPageUrl = function(page) {
    let [p, search] = page.split('?');
    return url.format({
        pathname: path.join(__dirname, p),
        search: search,
        protocol: 'file:',
        slashes: true
    });
};

let loadPage = function(window, page, openDevTools) {
    if (openDevTools) {
        window.openDevTools();
        window.webContents.on('devtools-opened', function() {
            window.loadURL(getPageUrl(page));
        });
    } else {
        window.loadURL(getPageUrl(page));
    }
};

let mainSend = function(channel, ...args) {
    if (!mainWindow) return;
    mainWindow.webContents.send(channel, ...args);
};

let progSend = function(channel, ...args) {
    if (!progressWindow) return;
    progressWindow.webContents.send(channel, ...args);
};

let resetProgress = function() {
    progSend('set-progress', {
        determinate: false,
        message: '...'
    });
};

let openMainWindow = function() {
    if (mainWindow) mainWindow.destroy();
    logger.info('Creating main window...');
    mainWindow = createWindow('main', { frame: false, show: false });
    logger.info('Main window created');
    logger.info('Loading application...');
    let verboseLogging = process.argv.includes('-verbose'),
        url = `app.html?verbose=${+verboseLogging}`;
    loadPage(mainWindow, url, env.name === 'development');
    mainWindow.once('ready-to-show', () => {
        logger.info('Application loaded.  Showing window.');
        mainWindow.show();
    });
};

let openProgressWindow = function() {
    let t = !process.argv.includes('--disable-transparency'),
        m = !process.argv.includes('--inspector-fix');
    logger.info(`Window transparency is ${t ? 'en' : 'dis'}abled`);
    logger.info(`Progress window is${m ? ' not ' : ' '}modal`);
    logger.info('Creating progress window...');
    progressWindow = new BrowserWindow({
        parent: mainWindow,
        title: "zEdit Progress",
        modal: m,
        show: true,
        frame: false,
        closable: false,
        transparent: t,
        focusable: false,
        maximizable: false,
        minimizable: false,
        resizable: false,
        movabale: false
    });
    progressWindow.hide();
    loadPage(progressWindow, 'progress.html');
    logger.info('Progress window created');
};

let getShouldReboot = function() {
    return !dialog.showMessageBox({
        type: 'error',
        buttons: ['Reboot', 'Close'],
        defaultId: 1,
        title: 'Crash Report',
        message: 'zEdit crashed.  This sometimes happens when an Antivirus interferes with the zEdit process.  You may want to try adding zEdit\'s installation folder to your Antivirus\'s exception list.',
        cancelId: 1
    });
};

let crashHandler = function()  {
    logger.error('Main window crashed!');
    if (!getShouldReboot()) return;
    logger.info('Rebooting...');
    createWindows();
};

let createWindows = function() {
    logger.info('Creating windows');
    openMainWindow();
    mainWindow.webContents.on('crash', crashHandler);
    mainWindow.on('closed', () => progressWindow.destroy());
    openProgressWindow();
};

app.on('ready', createWindows);

app.on('window-all-closed', () => {
    logger.close();
    app.quit();
});

ipcMain.on('show-progress', (e, p) => {
    logger.info('Showing progress window');
    progressWindow.setBounds(mainWindow.getContentBounds());
    progSend('set-progress', p);
    showProgressTimeout = setTimeout(() => progressWindow.show(), 50);
});

ipcMain.on('hide-progress', () => {
    logger.info('Hiding progress window');
    resetProgress();
    mainSend('progress-hidden');
    clearTimeout(showProgressTimeout);
    progressWindow.hide();
});

ipcMain.on('set-theme', (e, p) => progSend('set-theme', p));
ipcMain.on('progress-title', (e, p) => progSend('progress-title', p));
ipcMain.on('progress-message', (e, p) => progSend('progress-message', p));
ipcMain.on('progress-error', (e, p) => progSend('progress-error', p));
ipcMain.on('add-progress', (e, p) => progSend('add-progress', p));
ipcMain.on('log-message', (e, p) => progSend('log-message', p));
ipcMain.on('allow-close', () => progSend('allow-close'));
