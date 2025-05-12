import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../prisma/client';
import * as dotenv from 'dotenv';
import { parse } from 'date-fns';

dotenv.config();

const csvFilePath = 'src/scripts/data/CSV_05_12__13_14_09.csv';
const categoryCache: Map<string, string> = new Map(); // Stores category name → ID mapping

// Add mapping for Hebrew → English category names
const categoryNameMap: Record<string, string> = {
  'אופניים וקורקינט': 'Bikes & Scooters',
  'אינטרנט וטלוויזיה': 'Internet & TV',
  'חשבון גז': 'Gas Bill',
  'חשבון מים': 'Water Bill',
  השקעות: 'Investments',
  'ועד בית': 'Building Committee',
  חשבונות: 'Bills',
  חשמל: 'Electricity',
  חתונה: 'Wedding',
  טלפון: 'Phone',
  מונית: 'Taxi',
  'מוצרים לבית': 'Home Products',
  משכנתא: 'Mortgage',
  קולנוע: 'Cinema',
  'קופ"ח': 'HMO/Health Fund',
  תינוקות: 'Babies',
  תרומה: 'Donation',
};

function normalizeCategoryName(name: string): string {
  try {
    const trimmed = name.trim();
    return categoryNameMap[trimmed] || trimmed;
  } catch (error) {
    console.error(`Error normalizing category name: ${name}`, error);
    throw new Error(`Failed to normalize category name: ${name}, ${error}`);
  }
}

async function importData() {
  console.log('Start importing data');

  const rows: any[] = [];
  await readCSVFile(rows);
  await upsertCategories(rows);
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
    if (row.Category) {
      uniqueCategories.add(normalizeCategoryName(row.Category));
    }
  }

  console.log(`Found ${uniqueCategories.size} unique categories.`);

  const existingCategories = await prisma.category.findMany({
    where: { name: { in: Array.from(uniqueCategories) } },
  });

  for (const category of existingCategories) {
    categoryCache.set(category.name, category.id);
  }

  const existingCategoryNames = new Set(existingCategories.map((c) => c.name));
  const missingCategories = Array.from(uniqueCategories).filter(
    (name) => !existingCategoryNames.has(name),
  );

  if (missingCategories.length > 0) {
    console.log(`Inserting ${missingCategories.length} new categories...`);
    console.log(`Missing categories: ${missingCategories.join(', ')}`);

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
  const { Category, Date } = row;
  const normalizedCategory = normalizeCategoryName(Category);

  if (!categoryCache.has(normalizedCategory)) {
    throw new Error(
      `Category '${normalizedCategory}' not found in cache. This should not happen.`,
    );
  }

  const categoryId = categoryCache.get(normalizedCategory)!;
  const parsedDate = parseTransactionDate(Date);

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
  const type = row.Value > 0 ? 'INCOME' : 'EXPENSE';
  const value = Math.abs(row.Value);
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
