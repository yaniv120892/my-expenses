import scheduledTransactionService from '../services/scheduledTransactionService';

async function run() {
  const today = new Date();
  await scheduledTransactionService.processDueScheduledTransactions(today);
  process.exit(0);
}

run();
