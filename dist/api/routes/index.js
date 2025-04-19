"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const express_1 = require("express");
const authRoutes_1 = require("./authRoutes");
const chatRoutes_1 = require("./chatRoutes");
const healthRoutes_1 = require("./healthRoutes");
const setupRoutes = (authController, chatController, healthController, authService) => {
    const router = (0, express_1.Router)();
    router.use('/auth', (0, authRoutes_1.authRouter)(authController));
    router.use('/chats', (0, chatRoutes_1.chatRouter)(chatController, authService));
    router.use('/health', (0, healthRoutes_1.healthRouter)(healthController));
    return router;
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map