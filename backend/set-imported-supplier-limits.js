require('dotenv').config();
const dns = require('node:dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  const candidates = [
    process.env.MONGODB_URI,
    'mongodb://127.0.0.1:27017/whizunik-factoring',
    'mongodb://localhost:27017/whizunik-factoring',
  ].filter(Boolean);

  let connected = false;
  let lastError;
  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        family: 4,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      connected = true;
      break;
    } catch (err) {
      lastError = err;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }

  if (!connected) {
    throw lastError;
  }

  const db = mongoose.connection.db;
  const txCol = db.collection('transactions');
  const entCol = db.collection('entities');

  const supplierIds = await txCol.distinct('supplierId', {
    transactionId: /^TXN-CLOSED-/,
  });

  const result = await entCol.updateMany(
    {
      type: 'supplier',
      entityId: { $in: supplierIds },
    },
    {
      $set: {
        creditLimit: 50000,
        totalLimitSanctioned: 50000,
        availableLimit: 50000,
        usedLimit: 0,
        utilizedLimit: 0,
      },
    }
  );

  console.log(
    JSON.stringify(
      {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        supplierIdsCount: supplierIds.length,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore disconnect errors
  }
  process.exit(1);
});
