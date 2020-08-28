/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

class LoggerUtil {
    constructor(identifier) {
        this.identifier = identifier;
    }

    log(text) {
        console.log("%c[" + this.identifier + "]", "color: #43b581;", text);
    }

    info(text) {
        console.info("%c[" + this.identifier + "]", "color: #43b581;", text);
    }

    warn(text) {
        console.warn("%c[" + this.identifier + "]", "color: #43b581;", text);
    }

    debug(text) {
        console.debug("%c[" + this.identifier + "]", "color: #43b581;", text);
    }

    error(text) {
        console.error("%c[" + this.identifier + "]", "color: #43b581;", text);
    }
}

module.exports = function (identifier) {
    return new LoggerUtil(identifier);
}