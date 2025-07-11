"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const multer_1 = __importDefault(require("multer"));
const fileUploadService_1 = __importDefault(require("../services/fileUploadService"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = fileUploadService_1.default.getAllowedMimeTypes();
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: fileUploadService_1.default.getMaxFileSize(),
    },
});
exports.uploadSingleFile = upload.single('file');
exports.uploadMultipleFiles = upload.array('files', 10);
exports.default = { uploadSingleFile: exports.uploadSingleFile, uploadMultipleFiles: exports.uploadMultipleFiles };
