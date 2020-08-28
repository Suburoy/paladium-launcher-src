/**
 * Paladium Launcher - https://github.com/Paladium-Dev/Paladium-Launcher
 * Copyright (C) 2020 Paladium
 */

let target = require('./job_manager')[process.argv[2]];
if (target == null) {
    process.send({context: 'error', data: null, error: 'Invalid class name'});
    console.error('Invalid class name passed to argv[2], cannot continue.');
    process.exit(1);
}

let tracker = new target(...(process.argv.splice(3)));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

process.on('unhandledRejection', r => console.log(r));

function assignListeners() {
    tracker.on('validate', (data) => {
        process.send({context: 'validate', data});
    });
    tracker.on('progress', (data, acc, total) => {
        process.send({context: 'progress', data, value: acc, total, percent: parseInt((acc / total) * 100)});
    });
    tracker.on('complete', (data, ...args) => {
        process.send({context: 'complete', data, args});
    });
    tracker.on('error', (data, error) => {
        process.send({context: 'error', data, error});
    });
}

assignListeners();

process.on('message', (msg) => {
    if (msg.task === 'execute') {
        const func = msg.function;
        let nS = tracker[func]; // Nonstatic context
        let iS = target[func]; // Static context
        if (typeof nS === 'function' || typeof iS === 'function') {
            const f = typeof nS === 'function' ? nS : iS;
            const res = f.apply(f === nS ? tracker : null, msg.argsArr);
            if (res instanceof Promise) {
                res.then((v) => {
                    process.send({result: v, context: func});
                }).catch((err) => {
                    process.send({result: err.message || err, context: func});
                });
            }
            else
                process.send({result: res, context: func});
        }
        else
            process.send({context: 'error', data: null, error: `Function ${func} not found on ${process.argv[2]}`});
    }
    else if (msg.task === 'changeContext') {
        target = require('./job_manager')[msg.class];
        if (target == null)
            process.send({context: 'error', data: null, error: `Invalid class ${msg.class}`});
        else {
            tracker = new target(...(msg.args));
            assignListeners();
        }
    }
});

process.on('disconnect', () => {
    process.exit(0);
});
