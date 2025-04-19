"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const healthRouter = (healthController) => {
    const router = (0, express_1.Router)();
    router.get('/', healthController.checkHealth);
    return router;
};
exports.healthRouter = healthRouter;
//# sourceMappingURL=healthRoutes.js.map