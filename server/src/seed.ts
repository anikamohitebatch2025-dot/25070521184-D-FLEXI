import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.ts';
import { createInitialData } from './dbStore.ts';
import {
  User, MembershipPlan, Membership, Trainer, WorkoutSchedule,
  Enquiry, Appointment, Attendance, FitnessProgress, WorkoutPlan,
  DietPlan, Payment, Equipment, Inventory, Feedback,
  MemberGoal, Challenge, Notification
} from './models/index.ts';

async function seed() {
  console.log('🚀 FLEXI Database Seeder');
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Please ensure MongoDB is running or check your MONGODB_URI.');
    process.exit(1);
  }

  console.log('🔄 Cleaning existing collections...');
  await Promise.all([
    User.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Membership.deleteMany({}),
    Trainer.deleteMany({}),
    WorkoutSchedule.deleteMany({}),
    Enquiry.deleteMany({}),
    Appointment.deleteMany({}),
    Attendance.deleteMany({}),
    FitnessProgress.deleteMany({}),
    WorkoutPlan.deleteMany({}),
    DietPlan.deleteMany({}),
    Payment.deleteMany({}),
    Equipment.deleteMany({}),
    Inventory.deleteMany({}),
    Feedback.deleteMany({}),
    MemberGoal.deleteMany({}),
    Challenge.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('📦 Seeding pristine collections from store...');
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

  console.log(`✅ Seed successful! Loaded ${seed.users.length} users, ${seed.plans.length} plans, ${seed.trainers.length} trainers, and all records.`);
  await disconnectDB();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});

