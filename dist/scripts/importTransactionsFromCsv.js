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
const client_1 = __importDefault(require("../prisma/client"));
const dotenv = __importStar(require("dotenv"));
const date_fns_1 = require("date-fns");
dotenv.config();
const csvFilePath = 'src/scripts/data/CSV_05_07__14_03_20.csv';
const categoryCache = new Map(); // Stores category name → ID mapping
async function importData() {
    console.log('Start importing data');
    const rows = [];
    await readCSVFile(rows);
    // Step 1: Find all unique categories and insert missing ones into DB
    await upsertCategories(rows);
    // Step 2: Process transactions using the in-memory category cache
    await processRowsInBatches(rows);
    console.log('Data imported successfully');
    await client_1.default.$disconnect();
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
/** Step 2: Collect unique categories and batch insert missing ones */
async function upsertCategories(rows) {
    console.log('Extracting unique categories...');
    const uniqueCategories = new Set();
    for (const row of rows) {
        if (row.Category) {
            uniqueCategories.add(row.Category.trim());
        }
    }
    console.log(`Found ${uniqueCategories.size} unique categories.`);
    // Check which categories already exist in DB
    const existingCategories = await client_1.default.category.findMany({
        where: { name: { in: Array.from(uniqueCategories) } },
    });
    // Store existing categories in cache
    for (const category of existingCategories) {
        categoryCache.set(category.name, category.id);
    }
    // Identify missing categories
    const existingCategoryNames = new Set(existingCategories.map((c) => c.name));
    const missingCategories = Array.from(uniqueCategories).filter((name) => !existingCategoryNames.has(name));
    if (missingCategories.length > 0) {
        console.log(`Inserting ${missingCategories.length} new categories...`);
        const insertedCategories = await client_1.default.$transaction(missingCategories.map((name) => client_1.default.category.create({ data: { name } })));
        for (const category of insertedCategories) {
            categoryCache.set(category.name, category.id);
        }
    }
    console.log('Category upsert complete.');
}
/** Step 3: Process transactions using in-memory category cache */
async function processRowsInBatches(rows, batchSize = 10) {
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} (Rows ${i + 1} - ${i + batch.length})`);
        await Promise.all(batch.map(async (row) => await processRow(row)));
        console.log(`Batch ${i / batchSize + 1} processed successfully`);
    }
}
async function processRow(row) {
    const { Category, Date } = row;
    if (!categoryCache.has(Category)) {
        throw new Error(`Category '${Category}' not found in cache. This should not happen.`);
    }
    const categoryId = categoryCache.get(Category);
    const parsedDate = parseTransactionDate(Date);
    await createTransaction(row, parsedDate, categoryId);
}
function parseTransactionDate(transactionDate) {
    return (0, date_fns_1.parse)(transactionDate, 'MM/dd/yy', new Date());
}
async function createTransaction(row, parsedDate, categoryId) {
    const type = row.Value > 0 ? 'INCOME' : 'EXPENSE';
    const value = Math.abs(row.Value);
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
