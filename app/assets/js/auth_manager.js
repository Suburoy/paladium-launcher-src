/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

const ConfigManager = require('./config_manager');
const Mojang = require('./mojang');
const logger = require('./logger_util')('auth');

exports.addAccount = async function(username, password) {
    try {
        const session = await Mojang.authenticate(username, password, ConfigManager.getClientToken());
        if (session.selectedProfile != null) {
            const ret = ConfigManager.addAuthAccount(session.selectedProfile.id, session.accessToken, username, session.selectedProfile.name);
            if (ConfigManager.getClientToken() == null)
                ConfigManager.setClientToken(session.clientToken);
            ConfigManager.save();
            return ret;
        }
        else
            throw new Error('NotPaidAccount');
    }
    catch (exception) {
        return Promise.reject(exception);
    }
}

exports.removeAccount = async function(uuid){
    try {
        const authAcc = ConfigManager.getAuthAccount(uuid);
        await Mojang.invalidate(authAcc.accessToken, ConfigManager.getClientToken());
        ConfigManager.removeAuthAccount(uuid);
        ConfigManager.save();
        return Promise.resolve();
    }
    catch (exception) {
        return Promise.reject(exception)
    }
}

exports.validateSelected = async function() {
    const current = ConfigManager.getSelectedAccount();
    const isValid = await Mojang.validate(current.accessToken, ConfigManager.getClientToken());
    if (!isValid) {
        try {
            const session = await Mojang.refresh(current.accessToken, ConfigManager.getClientToken());
            ConfigManager.updateAuthAccount(current.uuid, session.accessToken);
            ConfigManager.save();
        }
        catch(exception) {
            logger.debug("Error while validating selected profile: " + err);
            logger.log("Account access token is invalid.");
            return false;
        }
        logger.log("Mojang account access token validated.");
        return true;
    }
    else {
        logger.log("Mojang account access token validated.");
        return true;
    }
}