import fs from 'fs';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';

dotenv.config();

const csvFilePath = 'src/scripts/data/CSV_05_12__13_14_09.csv';
const exportedFilePath = 'src/scripts/data/exported.csv';

async function exportCsv() {
  console.log('Start export data');

  const rows: any[] = [];
  await readCSVFile(rows);

  const rowsWithDescriptionAndCategory = new Set<string>();
  for (const row of rows) {
    const description: string = row.Notes;
    const categoryName: string = row.categoryName;

    const data = `${normalize(description)};${normalize(categoryName)}\n`;
    rowsWithDescriptionAndCategory.add(data);
  }

  const uniqueRows = new Set<string>();
  rowsWithDescriptionAndCategory.forEach((row) => {
    uniqueRows.add(row);
  });
  fs.writeFileSync(exportedFilePath, 'Description;Category\n');
  fs.appendFileSync(exportedFilePath, Array.from(uniqueRows).join(''));

  console.log('Data exported successfully');
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

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

exportCsv();
