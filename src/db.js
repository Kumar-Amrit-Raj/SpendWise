const mongoose = require('mongoose');
const { User, Transaction, Budget, RecurringRule, Investment } = require('./models');

async function repairTransactionIndexes() {
  const collection = mongoose.connection.collection('sw_transactions');
  let indexes = [];

  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error?.code !== 26) throw error;
  }

  const legacyIndex = indexes.find(index => (
    index.unique === true
    && index.key?.user === 1
    && index.key?.recurringRule === 1
    && index.key?.occurrenceKey === 1
    && !index.partialFilterExpression
  ));

  if (legacyIndex) {
    await collection.dropIndex(legacyIndex.name);
    console.log(`Removed legacy transaction index: ${legacyIndex.name}`);
  }

  await Promise.all([
    User.syncIndexes(),
    Transaction.syncIndexes(),
    Budget.syncIndexes(),
    RecurringRule.syncIndexes(),
    Investment.syncIndexes()
  ]);
}

async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not configured');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, autoIndex: false });
  await repairTransactionIndexes();
  console.log('SpendWise database connected');
}

module.exports = connectDatabase;
