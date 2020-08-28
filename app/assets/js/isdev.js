/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

'use strict'
const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
const isEnvSet = 'ELECTRON_IS_DEV' in process.env;

module.exports = isEnvSet ? getFromEnv : (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath));