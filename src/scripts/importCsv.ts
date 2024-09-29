import fs from 'fs';
import csv from 'csv-parser';
import prisma from '@src/prisma/client';
import * as dotenv from 'dotenv';
import { parse } from 'date-fns';

const csvFilePath = 'src/scripts/CSV_09_28__22_10_29.csv';

dotenv.config();

async function importData() {
  const rows: any[] = [];
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
    await processRow(row);
  }
}

async function processRow(row: any) {
  const { transactionValue, categoryName, transactionDate } = row;

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
