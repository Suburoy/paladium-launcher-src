/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const ConfigManager = require('./config_manager');

const logger = require('./logger_util')('preloader');

// Load ConfigManager
ConfigManager.load();

let nativesPath = path.join(os.tmpdir(), ConfigManager.getTempNativeFolder());
fs.remove(nativesPath, (exception) => {
    if (exception)
        logger.warn(`Cannot delete natives in folder: "${nativesPath}"`);
});
