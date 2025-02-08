import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../prisma/client';
import * as dotenv from 'dotenv';
import { parse } from 'date-fns';

dotenv.config();

const csvFilePath = 'src/scripts/data/CSV_02_02__09_20_08.csv';
const categoryCache: Map<string, string> = new Map(); // Stores category name → ID mapping

async function importData() {
  console.log('Start importing data');

  const rows: any[] = [];
  await readCSVFile(rows);

  // Step 1: Find all unique categories and insert missing ones into DB
  await upsertCategories(rows);

  // Step 2: Process transactions using the in-memory category cache
  await processRowsInBatches(rows);

  console.log('Data imported successfully');
  await prisma.$disconnect();
}

/** Step 1: Read CSV file into memory */
async function readCSVFile(rows: any[]) {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
}

/** Step 2: Collect unique categories and batch insert missing ones */
async function upsertCategories(rows: any[]) {
  console.log('Extracting unique categories...');

  const uniqueCategories = new Set<string>();
  for (const row of rows) {
    if (row.categoryName) {
      uniqueCategories.add(row.categoryName.trim());
    }
  }

  console.log(`Found ${uniqueCategories.size} unique categories.`);

  // Check which categories already exist in DB
  const existingCategories = await prisma.category.findMany({
    where: { name: { in: Array.from(uniqueCategories) } },
  });

  // Store existing categories in cache
  for (const category of existingCategories) {
    categoryCache.set(category.name, category.id);
  }

  // Identify missing categories
  const existingCategoryNames = new Set(existingCategories.map((c) => c.name));
  const missingCategories = Array.from(uniqueCategories).filter(
    (name) => !existingCategoryNames.has(name),
  );

  if (missingCategories.length > 0) {
    console.log(`Inserting ${missingCategories.length} new categories...`);

    const insertedCategories = await prisma.$transaction(
      missingCategories.map((name) =>
        prisma.category.create({ data: { name } }),
      ),
    );

    for (const category of insertedCategories) {
      categoryCache.set(category.name, category.id);
    }
  }

  console.log('Category upsert complete.');
}

/** Step 3: Process transactions using in-memory category cache */
async function processRowsInBatches(rows: any[], batchSize: number = 10) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(
      `Processing batch ${i / batchSize + 1} (Rows ${i + 1} - ${i + batch.length})`,
    );

    await Promise.all(batch.map(async (row) => await processRow(row)));

    console.log(`Batch ${i / batchSize + 1} processed successfully`);
  }
}

async function processRow(row: any) {
  const { categoryName, transactionDate } = row;

  if (!categoryCache.has(categoryName)) {
    throw new Error(
      `Category '${categoryName}' not found in cache. This should not happen.`,
    );
  }

  const categoryId = categoryCache.get(categoryName)!;
  const parsedDate = parseTransactionDate(transactionDate);

  await createTransaction(row, parsedDate, categoryId);
}

function parseTransactionDate(transactionDate: string): Date {
  return parse(transactionDate, 'MM/dd/yy', new Date());
}

async function createTransaction(
  row: any,
  parsedDate: Date,
  categoryId: string,
) {
  const type = row.transactionValue > 0 ? 'INCOME' : 'EXPENSE';
  const value = Math.abs(row.transactionValue);
  await prisma.transaction.create({
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
