"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("@/api/middleware/authMiddleware");
const chatRouter = (chatController, authService) => {
    const router = (0, express_1.Router)();
    const auth = (0, authMiddleware_1.authMiddleware)(authService);
    router.use(auth);
    router.post('/', chatController.createChat);
    router.get('/', chatController.getChats);
    router.get('/:chatId', chatController.getChatById);
    router.put('/:chatId/title', chatController.updateChatTitle);
    router.delete('/:chatId', chatController.deleteChat);
    router.get('/:chatId/messages', chatController.getChatMessages);
    return router;
};
exports.chatRouter = chatRouter;
//# sourceMappingURL=chatRoutes.js.map