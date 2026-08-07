"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const dotenv = __importStar(require("dotenv"));
const categoryMappingUtils_1 = require("./categoryMappingUtils");
dotenv.config();
const csvFilePath = 'src/scripts/data/CSV_05_12__13_14_09.csv';
const exportedFilePath = 'src/scripts/data/exported.csv';
async function exportCsv() {
    console.log('Start export data');
    const rows = [];
    await readCSVFile(rows);
    const rowsWithDescriptionAndCategory = new Set();
    for (const row of rows) {
        const description = row.Notes;
        const categoryName = row.Category;
        const data = `${normalize(description)};${(0, categoryMappingUtils_1.normalizeCategoryName)(categoryName)}\n`;
        rowsWithDescriptionAndCategory.add(data);
    }
    const uniqueRows = new Set();
    rowsWithDescriptionAndCategory.forEach((row) => {
        uniqueRows.add(row);
    });
    fs_1.default.writeFileSync(exportedFilePath, 'Description;Category\n');
    fs_1.default.appendFileSync(exportedFilePath, Array.from(uniqueRows).join(''));
    console.log('Data exported successfully');
}
/** Step 1: Read CSV file into memory */
async function readCSVFile(rows) {
    return new Promise((resolve, reject) => {
        fs_1.default.createReadStream(csvFilePath)
            .pipe((0, csv_parser_1.default)({ separator: ';' }))
            .on('data', (row) => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
    });
}
function normalize(value) {
    return value.trim().toLowerCase();
}
exportCsv();
