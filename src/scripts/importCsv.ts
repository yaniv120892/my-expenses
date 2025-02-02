import fs from 'fs';
import csv from 'csv-parser';
import prisma from '..//prisma/client';
import * as dotenv from 'dotenv';
import { parse } from 'date-fns';

const csvFilePath = 'src/scripts/data/CSV_02_02__09_20_08.csv';

dotenv.config();

async function importData() {
  const rows: any[] = [];
  console.log('Importing data...');
  await readCSVFile(rows);
  await processRowsSequentially(rows);

  console.log('Import completed!');
  await prisma.$disconnect();
}

async function readCSVFile(rows: any[]) {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
}

async function processRowsSequentially(rows: any[]) {
  for (const row of rows) {
    console.log('Processing row:', row);
    await processRow(row);
    console.log('Row processed:', row);
  }
}

async function processRow(row: any) {
  const { categoryName, transactionDate } = row;

  const category = await findOrCreateCategory(categoryName);
  const parsedDate = parseTransactionDate(transactionDate);

  await createTransaction(row, parsedDate, category.id);
}

async function findOrCreateCategory(categoryName: string) {
  let category = await prisma.category.findFirst({
    where: { name: categoryName },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName },
    });
  }

  return category;
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
