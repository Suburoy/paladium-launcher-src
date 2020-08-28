/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const sysRoot = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME);
const workingPath = path.join(sysRoot, '.paladium');

const launcherDir = process.env.CONFIG_DIRECT_PATH || require('electron').remote.app.getPath('userData');

exports.getLauncherDirectory = function() {
    return launcherDir;
}

exports.getWorkingDirectory = function(def = false) {
    return !def ? config.settings.launcher.workingDirectory : DEFAULT_CONFIG.settings.launcher.workingDirectory;
}

exports.setWorkingDirectory = function(workingDirectory) {
    config.settings.launcher.workingDirectory = workingDirectory
}

const configPath = path.join(exports.getLauncherDirectory(), 'config.json');
const configPathLEGACY = path.join(workingPath, 'config.json');
const firstLaunch = !fs.existsSync(configPath) && !fs.existsSync(configPathLEGACY);

exports.getAbsoluteMinRAM = function() {
    return 0.5;
}

exports.getAbsoluteMaxRAM = function() {
    const mem = os.totalmem();
    const gT16 = mem - 16000000000;
    return Math.floor((mem - 1000000000 - (gT16 > 0 ? (Number.parseInt(gT16 / 8) + 16000000000 / 4) : mem / 4)) / 1000000000);
}

function resolveMaxRAM() {
    const mem = os.totalmem();
    return mem >= 6000000000 ? '2G' : '1G';
}

function resolveMinRAM() {
    return '500M';
}

/**
 * Default config
 */
const DEFAULT_CONFIG = {
    settings: {
        launcher: {
            workingDirectory: workingPath,
            keepLauncherOpen : 'false',
            showGameLog : 'false'
        },
        java: {
            minRAM: resolveMinRAM(),
            maxRAM: resolveMaxRAM(),
            executable: null,
            jvmOptions: [
                '-XX:+UnlockExperimentalVMOptions',
                '-XX:+UseG1GC',
                '-XX:G1NewSizePercent=20',
                '-XX:G1ReservePercent=20',
                '-XX:MaxGCPauseMillis=50',
                '-XX:G1HeapRegionSize=32M',
                '-Xmn128M'
            ]
        }
    },
    clientToken: null,
    selectedInstance: null,
    selectedAccount: null,
    authenticationDatabase: {}
}

let config = null;

exports.save = function() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'UTF-8');
}

exports.load = function() {
    let doLoad = true;

    if (!fs.existsSync(configPath)) {
        fs.ensureDirSync(path.join(configPath, '..'));

        if (fs.existsSync(configPathLEGACY)) {
            fs.moveSync(configPathLEGACY, configPath);
        }
        else {
            doLoad = false;
            config = DEFAULT_CONFIG;
            exports.save();
        }
    }

    if (doLoad) {
        let doValidate = false;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));
            doValidate = true;
        }
        catch (exception) {
            fs.ensureDirSync(path.join(configPath, '..'));
            config = DEFAULT_CONFIG;
            exports.save();
        }

        if (doValidate) {
            config = validateKeySet(DEFAULT_CONFIG, config);
            exports.save();
        }
    }
}

exports.isLoaded = function() {
    return config != null;
}

function validateKeySet(srcObj, destObj){
    if (srcObj == null)
        srcObj = {};
    const validationBlacklist = ['authenticationDatabase'];
    const keys = Object.keys(srcObj);
    for (let i = 0; i < keys.length; i++) {
        if (typeof destObj[keys[i]] === 'undefined')
            destObj[keys[i]] = srcObj[keys[i]];
        else if (typeof srcObj[keys[i]] === 'object' && srcObj[keys[i]] != null && !(srcObj[keys[i]] instanceof Array) && validationBlacklist.indexOf(keys[i]) === -1)
            destObj[keys[i]] = validateKeySet(srcObj[keys[i]], destObj[keys[i]]);
    }
    return destObj;
}

exports.isFirstLaunch = function() {
    return firstLaunch;
}

exports.getTempNativeFolder = function() {
    return 'natives';
}

exports.getCommonDirectory = function() {
    return path.join(exports.getWorkingDirectory(), 'common');
}

exports.getInstanceDirectory = function() {
    return path.join(exports.getWorkingDirectory(), 'instances');
}

exports.getKeepLauncherOpen = function() {
    return config.keepLauncherOpen;
}

exports.setKeepLauncherOpen = function(value) {
    config.keepLauncherOpen = value
}

exports.getClientToken = function() {
    return config.clientToken;
}

exports.setClientToken = function(clientToken) {
    config.clientToken = clientToken
}

exports.getSelectedInstance = function(def = false) {
    return !def ? config.selectedInstance : DEFAULT_CONFIG.selectedInstance;
}

exports.setSelectedInstance = function(instanceID) {
    config.selectedInstance = instanceID;
}

exports.getAuthAccounts = function() {
    return config.authenticationDatabase;
}

exports.getAuthAccount = function(uuid) {
    return config.authenticationDatabase[uuid];
}

exports.updateAuthAccount = function(uuid, accessToken) {
    config.authenticationDatabase[uuid].accessToken = accessToken;
    return config.authenticationDatabase[uuid];
}

exports.addAuthAccount = function(uuid, accessToken, username, displayName) {
    config.selectedAccount = uuid;
    config.authenticationDatabase[uuid] = {
        accessToken,
        username: username.trim(),
        uuid: uuid.trim(),
        displayName: displayName.trim()
    }
    return config.authenticationDatabase[uuid];
}

exports.removeAuthAccount = function(uuid) {
    if (config.authenticationDatabase[uuid] != null) {
        delete config.authenticationDatabase[uuid];
        if (config.selectedAccount === uuid) {
            const keys = Object.keys(config.authenticationDatabase);
            if (keys.length > 0)
                config.selectedAccount = keys[0];
            else {
                config.selectedAccount = null;
                config.clientToken = null;
            }
        }
        return true;
    }
    return false;
}

exports.getSelectedAccount = function() {
    return config.authenticationDatabase[config.selectedAccount];
}

exports.setSelectedAccount = function(uuid) {
    const authAcc = config.authenticationDatabase[uuid];
    if (authAcc != null)
        config.selectedAccount = uuid;
    return authAcc;
}

exports.getMinRAM = function(def = false) {
    return !def ? config.settings.java.minRAM : DEFAULT_CONFIG.settings.java.minRAM;
}

exports.setMinRAM = function(minRAM) {
    config.settings.java.minRAM = minRAM;
}

exports.getMaxRAM = function(def = false) {
    return !def ? config.settings.java.maxRAM : resolveMaxRAM();
}

exports.setMaxRAM = function(maxRAM) {
    config.settings.java.maxRAM = maxRAM;
}

exports.getJavaExecutable = function() {
    return config.settings.java.executable;
}

exports.setJavaExecutable = function(executable) {
    config.settings.java.executable = executable;
}

exports.getJVMOptions = function(def = false) {
    return !def ? config.settings.java.jvmOptions : DEFAULT_CONFIG.settings.java.jvmOptions;
}

exports.setJVMOptions = function(jvmOptions) {
    config.settings.java.jvmOptions = jvmOptions;
}

exports.getLauncherConfigKeepOpen = function() {
    return config.settings.launcher.keepLauncherOpen;
}

exports.setLauncherConfigKeepOpen = function(isLauncherStayOpen) {
    config.settings.launcher.keepLauncherOpen = isLauncherStayOpen;
}
