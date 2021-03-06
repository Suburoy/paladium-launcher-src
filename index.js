/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

const {app, BrowserWindow, ipcMain} = require('electron');
const autoUpdater = require('electron-updater').autoUpdater;
const path = require('path');
const url = require('url');
const ejse = require('ejs-electron');
const isDev = require('./app/assets/js/isdev');

let frame;
let console_frame;
let isInitAutoUpdater = false;

function initAutoUpdater(event) {
    autoUpdater.autoDownload = false;

    if (isDev) {
        autoUpdater.autoInstallOnAppQuit = false;
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
    }
    if (process.platform === 'darwin')
        autoUpdater.autoDownload = false;

    autoUpdater.on('update-available', info => {
        event.sender.send('autoUpdateNotification', 'update-available', info);
    });
    autoUpdater.on('update-downloaded', info => {
        event.sender.send('autoUpdateNotification', 'update-downloaded', info);
    });
    autoUpdater.on('download-progress', (info) => {
        event.sender.send('autoUpdateNotification', 'download-progress', info);
    });
    autoUpdater.on('update-not-available', info => {
        event.sender.send('autoUpdateNotification', 'update-not-available', info);
    });
    autoUpdater.on('checking-for-update', () => {
        event.sender.send('autoUpdateNotification', 'checking-for-update');
    });
    autoUpdater.on('error', (err) => {
        event.sender.send('autoUpdateNotification', 'realerror', err);
    });
}

function initialize() {
    app.disableHardwareAcceleration();

	if (makeSingleInstance())
		return app.quit();
    ipcMain.on('autoUpdateAction', (event, arg, data) => {
        switch(arg) {
            case 'initAutoUpdater': {
                if (!isInitAutoUpdater) {
                    initAutoUpdater(event);
                    isInitAutoUpdater = true;
                }
                event.sender.send('autoUpdateNotification', 'ready');
                break;
            }
            case 'checkForUpdate': {
                autoUpdater.checkForUpdates().catch(err => {
                    event.sender.send('autoUpdateNotification', 'realerror', err);
                });
                break;
            }
            case 'downloadUpdate': {
                autoUpdater.downloadUpdate();
                break;
            }
            case 'installUpdateNow': {
                autoUpdater.quitAndInstall();
                break;
            }
            default: {
                console.log('Unknown argument', arg);
                break;
            }
        }
    });

    ipcMain.on('consoleAction', (event, arg, type, identifier, data) => {
        if (console_frame == null)
            return;
        switch(arg) {
            case 'logger': {
                console_frame.webContents.send('consoleLog', type, identifier, data);
                break;
            }
            case 'show': {
                console_frame.show();
                break;
            }
            case 'show/hide': {
                if (console_frame.isVisible())
                    console_frame.hide();
                else
                    console_frame.show();
                break;
            }
        }
    });

    app.on('ready', () => {
        createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            app.quit();
    });

    app.on('activate', () => {
        if (frame === null)
            createWindow();
    });
}

function createWindow() {
    frame = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280,
        minHeight: 720,
        icon: getPlatformIcon('icon'),
        resizable: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'app', 'assets', 'js', 'preloader.js'),
            nodeIntegration: true,
            webSecurity: true,
            contextIsolation: false,
            devTools: true
        },
        backgroundColor: '#333336'
    });

    //frame.webContents.openDevTools();

    frame.loadURL(url.format({
        pathname: path.join(__dirname, 'app', 'app.ejs'),
        protocol: 'file:',
        slashes: true
    }));

    frame.removeMenu();

    frame.on('closed', () => {
        frame = null;
        app.quit();
    });
}

function getPlatformIcon(filename) {
    const os = process.platform;
    if (os === 'darwin')
        filename = filename + '.icns';
    else if (os === 'win32')
        filename = filename + '.ico';
    else
        filename = filename + '.png';
    return path.join(__dirname, 'app', 'assets', 'images', 'icons', 'favicon', filename);
}

function makeSingleInstance() {
    const lock = app.requestSingleInstanceLock();

	if (process.mas)
		return false;
	if (!lock)
        app.quit();
    else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            if (frame) {
                if (frame.isMinimized()) {
                    frame.restore();
                    frame.focus();
                }
            }
        });
    }
}

initialize();