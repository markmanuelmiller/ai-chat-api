"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    },
};
//# sourceMappingURL=logger.js.map