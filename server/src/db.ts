import mongoose from 'mongoose';
import { createInitialData } from './dbStore.ts';
import {
  User, MembershipPlan, Membership, Trainer, WorkoutSchedule,
  Enquiry, Appointment, Attendance, FitnessProgress, WorkoutPlan,
  DietPlan, Payment, Equipment, Inventory, Feedback,
  MemberGoal, Challenge, Notification, generateObjectId
} from './models/index.ts';

// Helper to mask MongoDB URI credentials for security
export function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/i, '$1***:***@');
  } catch {
    return 'mongodb://***';
  }
}

let dbConnected = false;
let dbConnecting = false;

export function isDbConnected(): boolean {
  return dbConnected && mongoose.connection.readyState === 1;
}

export function getDbStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    stateCode,
    isConnected: stateCode === 1,
    databaseName: mongoose.connection.name || 'gym_management',
    host: mongoose.connection.host || 'unknown',
    port: mongoose.connection.port || 27017,
  };
}

export async function connectDB(explicitUri?: string): Promise<boolean> {
  if (dbConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (dbConnecting) {
    // Wait for ongoing connection
    let waited = 0;
    while (dbConnecting && waited < 10) {
      await new Promise(r => setTimeout(r, 500));
      waited++;
      if (mongoose.connection.readyState === 1) return true;
    }
  }

  const uri = explicitUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_management';
  const masked = maskMongoUri(uri);

  dbConnecting = true;
  console.log(`🔌 Attempting MongoDB connection to: ${masked}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    dbConnected = true;
    dbConnecting = false;
    console.log(`✅ MongoDB connected successfully to database "${mongoose.connection.name}" at ${mongoose.connection.host}`);

    // Automatically check and seed pristine demo data if collections are empty
    await autoSeedIfEmpty();

    return true;
  } catch (error: any) {
    dbConnected = false;
    dbConnecting = false;
    console.warn(`⚠️ MongoDB connection attempt failed: ${error.message}`);
    console.warn(`   (Target URI: ${masked})`);
    console.warn(`   To view/manage data in MongoDB Compass, start MongoDB service or provide a valid MONGODB_URI in server/.env`);
    return false;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      dbConnected = false;
      console.log('🔌 MongoDB connection closed cleanly.');
    }
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }
}

// Perform a real write-and-read test in MongoDB
export async function verifyDatabaseWriteRead(): Promise<{ success: boolean; message: string; details?: any }> {
  if (!isDbConnected()) {
    return {
      success: false,
      message: 'MongoDB is not connected. Real write-and-read verification cannot proceed.',
    };
  }

  const testCollectionName = '__connection_verification';
  const testId = `test_${generateObjectId()}`;
  const testPayload = {
    testId,
    verifiedAt: new Date().toISOString(),
    project: 'FLEXI Gym Management',
    status: 'ACTIVE_VERIFIED',
    randomNonce: Math.random().toString(36).substring(2, 10),
  };

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return { success: false, message: 'Database handle is unavailable.' };
    }

    const testCol = db.collection(testCollectionName);

    // 1. Write
    const writeResult = await testCol.insertOne({ ...testPayload });
    if (!writeResult.acknowledged) {
      return { success: false, message: 'Write operation was not acknowledged by MongoDB.' };
    }

    // 2. Read
    const readDoc = await testCol.findOne({ testId });
    if (!readDoc) {
      return { success: false, message: 'Read operation could not locate the inserted test document.' };
    }

    // 3. Verify integrity
    const matches = readDoc.testId === testPayload.testId && readDoc.randomNonce === testPayload.randomNonce;
    if (!matches) {
      return { success: false, message: 'Data integrity mismatch between written and read document.' };
    }

    // 4. Delete test record to clean up
    await testCol.deleteOne({ testId });

    return {
      success: true,
      message: 'Database write, read, and delete verification completed successfully.',
      details: {
        databaseName: mongoose.connection.name,
        collection: testCollectionName,
        testId,
        readMatch: true,
        cleanupDone: true,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Database verification failed: ${error.message}`,
    };
  }
}

// Automatically seed MongoDB if empty
export async function autoSeedIfEmpty(): Promise<boolean> {
  if (!isDbConnected()) return false;

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // Collections already populated
      return false;
    }

    console.log('🌱 Populating empty MongoDB with initial seeds from database store...');
    const seed = await createInitialData();

    await Promise.all([
      User.insertMany(seed.users),
      MembershipPlan.insertMany(seed.plans),
      Membership.insertMany(seed.memberships),
      Trainer.insertMany(seed.trainers),
      WorkoutSchedule.insertMany(seed.schedules),
      Enquiry.insertMany(seed.enquiries),
      Appointment.insertMany(seed.appointments),
      Attendance.insertMany(seed.attendance),
      FitnessProgress.insertMany(seed.fitnessProgress),
      WorkoutPlan.insertMany(seed.workoutPlans),
      DietPlan.insertMany(seed.dietPlans),
      Payment.insertMany(seed.payments),
      Equipment.insertMany(seed.equipment),
      Inventory.insertMany(seed.inventory),
      Feedback.insertMany(seed.feedbacks),
      MemberGoal.insertMany(seed.memberGoals),
      Challenge.insertMany(seed.challenges),
      Notification.insertMany(seed.notifications),
    ]);

    console.log(`✨ Seed complete! ${seed.users.length} users and 17 collections populated in MongoDB.`);
    return true;
  } catch (err: any) {
    console.error('Failed to auto-seed MongoDB:', err.message);
    return false;
  }
}

// Graceful process cleanup
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

