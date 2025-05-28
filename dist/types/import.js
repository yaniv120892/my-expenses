"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportStatus = exports.ImportFileType = void 0;
var ImportFileType;
(function (ImportFileType) {
    ImportFileType["CAL_CREDIT"] = "CAL_CREDIT";
    ImportFileType["AMERICAN_EXPRESS_CREDIT"] = "AMERICAN_EXPRESS_CREDIT";
})(ImportFileType || (exports.ImportFileType = ImportFileType = {}));
var ImportStatus;
(function (ImportStatus) {
    ImportStatus["PENDING"] = "PENDING";
    ImportStatus["PROCESSING"] = "PROCESSING";
    ImportStatus["COMPLETED"] = "COMPLETED";
    ImportStatus["FAILED"] = "FAILED";
})(ImportStatus || (exports.ImportStatus = ImportStatus = {}));
