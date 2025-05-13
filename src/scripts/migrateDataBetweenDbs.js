const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function resolveCaCertPath(caCertPath) {
  if (path.isAbsolute(caCertPath)) {
    return caCertPath;
  }
  return path.resolve(__dirname, caCertPath);
}

function createClient(connectionString, ssl = false, caCertPath = null) {
  if (ssl && caCertPath) {
    const caPath = resolveCaCertPath(caCertPath);
    const ca = fs.readFileSync(caPath).toString();
    return new Client({ connectionString, ssl: { ca } });
  }
  if (ssl) {
    return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return new Client({ connectionString });
}

async function fetchAllRows(client, tableName) {
  const result = await client.query(`SELECT * FROM "${tableName}"`);
  return result.rows;
}

function wrapWithQuotes(identifier) {
  return `"${identifier}"`;
}

async function insertRows(client, tableName, rows) {
  for (const row of rows) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const quotedColumns = columns.map(wrapWithQuotes);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${wrapWithQuotes(tableName)} (${quotedColumns.join(', ')}) VALUES (${placeholders})`;
    await client.query(query, values);
  }
}

async function copyTable(sourceClient, targetClient, tableName) {
  const rows = await fetchAllRows(sourceClient, tableName);
  await insertRows(targetClient, tableName, rows);
}

async function main() {
  const sourceDbUrl = process.env.SOURCE_DB_URL;
  if (!sourceDbUrl) {
    console.error('SOURCE_DB_URL environment variable is not set.');
    process.exit(1);
  }
  const targetDbUrl = process.env.TARGET_DB_URL;
  if (!targetDbUrl) {
    console.error('TARGET_DB_URL environment variable is not set.');
    process.exit(1);
  }
  const sourceClient = createClient(sourceDbUrl);
  const targetClient = createClient(targetDbUrl, true, 'ca.pem');
  await sourceClient.connect();
  await targetClient.connect();
  await copyTable(sourceClient, targetClient, 'ScheduledTransaction');
  await copyTable(sourceClient, targetClient, 'Transaction');
  await sourceClient.end();
  await targetClient.end();
}

main();
