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
const client_1 = __importDefault(require("..//prisma/client"));
const dotenv = __importStar(require("dotenv"));
const date_fns_1 = require("date-fns");
const csvFilePath = 'src/scripts/CSV_09_28__22_10_29.csv';
dotenv.config();
async function importData() {
    const rows = [];
    await readCSVFile(rows);
    await processRowsSequentially(rows);
    console.log('Import completed!');
    await client_1.default.$disconnect();
}
async function readCSVFile(rows) {
    return new Promise((resolve, reject) => {
        fs_1.default.createReadStream(csvFilePath)
            .pipe((0, csv_parser_1.default)({ separator: ';' }))
            .on('data', (row) => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
    });
}
async function processRowsSequentially(rows) {
    for (const row of rows) {
        await processRow(row);
    }
}
async function processRow(row) {
    const { transactionValue, categoryName, transactionDate } = row;
    const category = await findOrCreateCategory(categoryName);
    const parsedDate = parseTransactionDate(transactionDate);
    await createTransaction(row, parsedDate, category.id);
}
async function findOrCreateCategory(categoryName) {
    let category = await client_1.default.category.findFirst({
        where: { name: categoryName },
    });
    if (!category) {
        category = await client_1.default.category.create({
            data: { name: categoryName },
        });
    }
    return category;
}
function parseTransactionDate(transactionDate) {
    return (0, date_fns_1.parse)(transactionDate, 'MM/dd/yy', new Date());
}
async function createTransaction(row, parsedDate, categoryId) {
    const type = row.transactionValue > 0 ? 'INCOME' : 'EXPENSE';
    const value = Math.abs(row.transactionValue);
    await client_1.default.transaction.create({
        data: {
            description: row.Notes || '',
            value,
            date: parsedDate,
            categoryId,
            type,
        },
    });
}
importData();
