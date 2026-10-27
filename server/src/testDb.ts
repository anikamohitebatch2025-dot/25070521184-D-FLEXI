import 'dotenv/config';
import { connectDB, disconnectDB, verifyDatabaseWriteRead, getDbStatus } from './db.ts';

async function runTest() {
  console.log('🧪 Starting MongoDB Connection and Write/Read Test...');
  const connected = await connectDB();
  const status = getDbStatus();

  console.log('📊 Connection Status:', status);

  if (!connected) {
    console.error('❌ Connection FAILED. MongoDB is unreachable.');
    process.exit(1);
  }

  const result = await verifyDatabaseWriteRead();
  console.log('📝 Write/Read Test Result:', result);

  await disconnectDB();
  if (result.success) {
    console.log('🎉 Verification PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Verification FAILED!');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

