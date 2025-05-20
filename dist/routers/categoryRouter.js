"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handleRequest_1 = require("../utils/handleRequest");
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
const router = express_1.default.Router();
router.get('/', (0, handleRequest_1.handleRequest)(() => categoryController_1.default.list(), 200));
exports.default = router;
