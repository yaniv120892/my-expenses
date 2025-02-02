"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = void 0;
const handleRequest = (fn, status = 200) => {
    return async (req, res, next) => {
        try {
            const result = await fn(req);
            res.status(status).json(result);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.handleRequest = handleRequest;
