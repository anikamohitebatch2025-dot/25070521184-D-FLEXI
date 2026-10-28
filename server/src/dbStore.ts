import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  User, MembershipPlan, Membership, Trainer, WorkoutSchedule,
  Enquiry, Appointment, Attendance, FitnessProgress, WorkoutPlan,
  DietPlan, Payment, Equipment, Inventory, Feedback,
  MemberGoal, Challenge, Notification
} from './models/index.ts';

// Define MongoDB-like document types
export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  password?: string; // hashed
  phone: string;
  role: 'admin' | 'member' | 'trainer';
  trainerId?: string; // If role is trainer
  assignedTrainerId?: string; // If member has an assigned trainer
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanDoc {
  _id: string;
  name: string;
  price: number;
  duration: number; // in days
  description: string;
  benefits: string[];
  workoutAccess: string;
  trainerSupport: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipDoc {
  _id: string;
  userId: string;
  planId: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  paymentMethod?: string;
  amountPaid?: number;
  autoRenew?: boolean;
  renewalDiscountApplied?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerDoc {
  _id: string;
  name: string;
  photoUrl: string;
  specialization: string;
  experience: string; // e.g. "8+ Years"
  bio: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  rating?: number;
  totalReviews?: number;
  availableDays?: string[];
  availableSlots?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutScheduleDoc {
  _id: string;
  title: string;
  workoutType: 'Weight Training' | 'Cardio' | 'Strength Training' | 'Weight Loss' | 'Muscle Building' | 'Personal Training' | string;
  trainerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: number; // in minutes
  description: string;
  maxCapacity?: number;
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDoc {
  _id: string;
  userId?: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  service: string;
  trainerId?: string;
  trainerName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 AM"
  duration: number; // in minutes
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// 1. Attendance Model
export interface AttendanceDoc {
  _id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  checkInTime: string; // ISO
  checkOutTime?: string;
  date: string; // YYYY-MM-DD
  method: 'QR_SCAN' | 'MANUAL_KIOSK' | 'ADMIN_OVERRIDE';
  location: string;
  status: 'Checked In' | 'Completed';
}

// 2. Fitness Progress Model
export interface FitnessProgressDoc {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  heightCm: number;
  bmi: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  notes?: string;
  createdAt: string;
}

// 3. Workout Plan Model
export interface ExerciseItem {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  weightTargetKg?: number;
  completedSets?: number;
  isCompleted?: boolean;
}

export interface WorkoutPlanDoc {
  _id: string;
  userId: string; // assigned member
  trainerId?: string; // creator / coach
  title: string;
  dayOfWeek: string; // Monday, Tuesday, etc. or 'Daily'
  category: 'Strength' | 'Hypertrophy' | 'Cardio' | 'Mobility' | 'Fat Loss';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  exercises: ExerciseItem[];
  notes?: string;
  assignedDate: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 4. Diet & Nutrition Model
export interface MealItem {
  id: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  title: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  isLogged: boolean;
  notes?: string;
}

export interface DietPlanDoc {
  _id: string;
  userId: string;
  trainerId?: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  waterTargetMl: number;
  waterConsumedMl: number;
  date: string; // YYYY-MM-DD
  meals: MealItem[];
  dietaryPreference?: 'Omnivore' | 'High Protein' | 'Keto' | 'Vegan' | 'Vegetarian';
  createdAt: string;
  updatedAt: string;
}

// 5. Payment & Invoices Model
export interface PaymentDoc {
  _id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  membershipId?: string;
  planId?: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  items: { description: string; amount: number }[];
  subtotal: number;
  taxAmount: number;
  createdAt?: string;
}

// 6. Gym Equipment Model
export interface EquipmentDoc {
  _id: string;
  name: string;
  category: 'Cardio' | 'Strength Machine' | 'Free Weights' | 'Recovery' | 'Functional';
  brand: string;
  serialNumber: string;
  location: string;
  condition: 'Excellent' | 'Good' | 'Needs Maintenance' | 'Out of Order';
  lastServicedDate: string; // YYYY-MM-DD
  nextServiceDueDate: string; // YYYY-MM-DD
  technicianNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 7. Inventory Model
export interface InventoryDoc {
  _id: string;
  name: string;
  category: 'Supplements' | 'Apparel' | 'Accessories' | 'Beverages';
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minThreshold: number;
  unit: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 8. Feedback & Rating Model
export interface FeedbackDoc {
  _id: string;
  userId: string;
  memberName: string;
  targetType: 'trainer' | 'facility' | 'equipment';
  trainerId?: string;
  trainerName?: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
  createdAt: string;
}

// 9. Member Goals & Milestones
export interface MemberGoalDoc {
  _id: string;
  userId: string;
  title: string;
  category: 'Weight Loss' | 'Muscle Gain' | 'Personal Record' | 'Consistency';
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string; // YYYY-MM-DD
  status: 'in_progress' | 'achieved';
  achievedAt?: string;
  createdAt: string;
}

// 10. Gamification Challenges
export interface ChallengeDoc {
  _id: string;
  title: string;
  description: string;
  badgeName: string;
  badgeIcon: string; // e.g. "Flame", "Trophy", "Award", "Zap"
  category: 'Strength' | 'Cardio' | 'Endurance' | 'Consistency';
  targetGoal: string;
  durationDays: number;
  points: number;
  participantsCount: number;
  isPopular?: boolean;
}

// 11. In-App Notifications
export interface NotificationDoc {
  _id: string;
  userId: string; // or 'all'
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'expiry' | 'challenge' | 'workout' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DBData {
  users: UserDoc[];
  plans: MembershipPlanDoc[];
  memberships: MembershipDoc[];
  trainers: TrainerDoc[];
  schedules: WorkoutScheduleDoc[];
  enquiries: EnquiryDoc[];
  appointments: AppointmentDoc[];
  attendance: AttendanceDoc[];
  fitnessProgress: FitnessProgressDoc[];
  workoutPlans: WorkoutPlanDoc[];
  dietPlans: DietPlanDoc[];
  payments: PaymentDoc[];
  equipment: EquipmentDoc[];
  inventory: InventoryDoc[];
  feedbacks: FeedbackDoc[];
  memberGoals: MemberGoalDoc[];
  challenges: ChallengeDoc[];
  notifications: NotificationDoc[];
}

// Generate valid 24-character hexadecimal ObjectId string
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + random).substring(0, 24);
}

// Resolve paths using __dirname so it works both locally (tsx) and on Vercel (serverless)
const __dbFilename = fileURLToPath(import.meta.url);
const __dbDirname = path.dirname(__dbFilename);

// Source data directory (relative to this file: server/src/ -> server/data/)
const SOURCE_DATA_DIR = path.resolve(__dbDirname, '..', 'data');
const SOURCE_DB_FILE = path.resolve(SOURCE_DATA_DIR, 'mongodb_store.json');

// On Vercel, filesystem is read-only except /tmp — use /tmp for writes
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp' : SOURCE_DATA_DIR;
const DB_FILE = isVercel ? '/tmp/mongodb_store.json' : SOURCE_DB_FILE;

// Initial seed data generator
export async function createInitialData(): Promise<DBData> {
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const memberPasswordHash = await bcrypt.hash('Member@123', 10);
  const trainerPasswordHash = await bcrypt.hash('Trainer@123', 10);

  const adminId = '65d1a1000000000000000001';
  const member1Id = '65d1a1000000000000000002'; // John Miller
  const member2Id = '65d1a1000000000000000003'; // Sarah Jenkins
  const member3Id = '65d1a1000000000000000004'; // Devon Patel
  const trainerUserId = '65d1a1000000000000000005'; // Marcus Vance user

  const planMonthlyId = '65d1b2000000000000000001';
  const planQuarterlyId = '65d1b2000000000000000002';
  const planYearlyId = '65d1b2000000000000000003';

  const trainer1Id = '65d1c3000000000000000001';
  const trainer2Id = '65d1c3000000000000000002';
  const trainer3Id = '65d1c3000000000000000003';
  const trainer4Id = '65d1c3000000000000000004';

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const seventyFiveDaysAhead = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString();
  const expiredDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(now.getTime() + 86400000 * 2).toISOString().split('T')[0];

  const users: UserDoc[] = [
    {
      _id: adminId,
      name: 'Hardik Bhasme (Admin)',
      email: 'admin@flexigym.com',
      password: adminPasswordHash,
      phone: '+1 (555) 019-2834',
      role: 'admin',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: member1Id,
      name: 'John Miller',
      email: 'john@example.com',
      password: memberPasswordHash,
      phone: '+1 (555) 349-1120',
      role: 'member',
      assignedTrainerId: trainer1Id,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: member2Id,
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      password: memberPasswordHash,
      phone: '+1 (555) 482-9901',
      role: 'member',
      assignedTrainerId: trainer2Id,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: member3Id,
      name: 'Devon Patel',
      email: 'devon.p@example.com',
      password: memberPasswordHash,
      phone: '+1 (555) 781-6453',
      role: 'member',
      assignedTrainerId: trainer4Id,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: trainerUserId,
      name: 'Marcus Vance (Coach)',
      email: 'marcus@flexigym.com',
      password: trainerPasswordHash,
      phone: '+1 (555) 902-1144',
      role: 'trainer',
      trainerId: trainer1Id,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
  ];

  const plans: MembershipPlanDoc[] = [
    {
      _id: planMonthlyId,
      name: 'Monthly Pass',
      price: 49,
      duration: 30,
      description: 'Ideal for short-term fitness goals and flexible schedules.',
      benefits: [
        'Full gym floor & Olympic lifting access',
        'Standard locker room & shower access',
        'FLEXI mobile workout companion app',
        'Complimentary 1-hour fitness assessment',
        'Free WiFi & hydration station'
      ],
      workoutAccess: 'All open gym hours (5am - 11pm)',
      trainerSupport: 'General floor coaches available',
      isActive: true,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: planQuarterlyId,
      name: 'Quarterly Pro',
      price: 129,
      duration: 90,
      description: 'Our most popular plan for dedicated body recomposition and steady progression.',
      benefits: [
        'Everything in Monthly Pass',
        '3 Complimentary 1-on-1 Personal Training sessions',
        'Unlimited premium group HIIT & strength classes',
        'Monthly InBody body composition scan',
        'Infrared sauna & recovery lounge access',
        '10% discount on FLEXI pro shop supplements'
      ],
      workoutAccess: '24/7 keycard access to all facilities',
      trainerSupport: 'Assigned personal coach check-in',
      isActive: true,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: planYearlyId,
      name: 'Annual Elite',
      price: 399,
      duration: 365,
      description: 'The ultimate all-inclusive fitness lifestyle membership for peak athletic performance.',
      benefits: [
        'Everything in Quarterly Pro',
        '12 Private 1-on-1 training sessions per year',
        'Customized nutrition blueprint & macro adjustments',
        'Unlimited VIP guest passes (2 per month)',
        'Cryotherapy & cold plunge tub priority access',
        'Exclusive branded FLEXI athlete gear pack',
        'Complimentary towel & locker laundry service'
      ],
      workoutAccess: '24/7 VIP keycard & priority booking',
      trainerSupport: 'Dedicated Master Trainer & weekly review',
      isActive: true,
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
  ];

  const memberships: MembershipDoc[] = [
    {
      _id: '65d1d4000000000000000001',
      userId: member1Id,
      planId: planQuarterlyId,
      startDate: fifteenDaysAgo,
      endDate: seventyFiveDaysAhead, // Active
      paymentMethod: 'Credit Card',
      amountPaid: 129,
      autoRenew: true,
      createdAt: fifteenDaysAgo,
      updatedAt: fifteenDaysAgo,
    },
    {
      _id: '65d1d4000000000000000002',
      userId: member2Id,
      planId: planMonthlyId,
      startDate: thirtyDaysAgo,
      endDate: thirtyDaysAhead, // Active
      paymentMethod: 'Debit Card',
      amountPaid: 49,
      autoRenew: false,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: '65d1d4000000000000000003',
      userId: member3Id,
      planId: planMonthlyId,
      startDate: sixtyDaysAgo,
      endDate: expiredDate, // Expired
      paymentMethod: 'UPI / Online',
      amountPaid: 49,
      autoRenew: false,
      createdAt: sixtyDaysAgo,
      updatedAt: expiredDate,
    },
  ];

  const trainers: TrainerDoc[] = [
    {
      _id: trainer1Id,
      name: 'Marcus Vance',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      specialization: 'Strength Training & Powerlifting',
      experience: '8+ Years',
      bio: 'Former collegiate powerlifting champion specializing in compound lifts, periodized progressive overload, and biomechanics.',
      isActive: true,
      email: 'marcus@flexigym.com',
      phone: '+1 (555) 902-1144',
      hourlyRate: 65,
      rating: 4.9,
      totalReviews: 48,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableSlots: ['07:00 AM', '08:30 AM', '10:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'],
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: trainer2Id,
      name: 'Elena Rostova',
      photoUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80',
      specialization: 'HIIT & Weight Loss Conditioning',
      experience: '6+ Years',
      bio: 'Certified metabolic conditioning specialist focusing on sustainable fat loss, metabolic acceleration, and cardiovascular endurance.',
      isActive: true,
      email: 'elena@flexigym.com',
      phone: '+1 (555) 781-9922',
      hourlyRate: 55,
      rating: 4.8,
      totalReviews: 36,
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      availableSlots: ['08:00 AM', '09:30 AM', '11:00 AM', '03:00 PM', '05:30 PM'],
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: trainer3Id,
      name: 'Liam Chen',
      photoUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=800&q=80',
      specialization: 'Muscle Building & Hypertrophy',
      experience: '7+ Years',
      bio: 'Bodybuilding coach and certified sports nutritionist dedicated to hypertrophy science, mind-muscle connection, and clean bulking protocols.',
      isActive: true,
      email: 'liam@flexigym.com',
      phone: '+1 (555) 438-6677',
      hourlyRate: 60,
      rating: 4.9,
      totalReviews: 42,
      availableDays: ['Tuesday', 'Thursday', 'Friday', 'Sunday'],
      availableSlots: ['09:00 AM', '10:30 AM', '01:00 PM', '04:00 PM', '06:30 PM'],
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: trainer4Id,
      name: 'Maya Patel',
      photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      specialization: 'Personal Training & Functional Mobility',
      experience: '5+ Years',
      bio: 'Functional movement specialist helping athletes recover joint range of motion, build core stability, and prevent injury.',
      isActive: true,
      email: 'maya@flexigym.com',
      phone: '+1 (555) 312-8800',
      hourlyRate: 50,
      rating: 5.0,
      totalReviews: 29,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
      availableSlots: ['08:00 AM', '10:00 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
  ];

  const schedules: WorkoutScheduleDoc[] = [
    {
      _id: '65d1e5000000000000000001',
      title: 'Barbell Mastery & Core Blast',
      workoutType: 'Strength Training',
      trainerId: trainer1Id,
      date: todayStr,
      startTime: '07:00',
      duration: 60,
      description: 'Focus on deadlifts, bench presses, and heavy squat variations with strict safety coaching.',
      maxCapacity: 15,
      enrolledCount: 9,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: '65d1e5000000000000000002',
      title: 'Metabolic Inferno HIIT',
      workoutType: 'Weight Loss',
      trainerId: trainer2Id,
      date: todayStr,
      startTime: '09:30',
      duration: 45,
      description: 'High-octane interval training designed to push your anaerobic threshold and maximize calorie burn.',
      maxCapacity: 20,
      enrolledCount: 16,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: '65d1e5000000000000000003',
      title: 'Upper Body Hypertrophy Forge',
      workoutType: 'Muscle Building',
      trainerId: trainer3Id,
      date: tomorrowStr,
      startTime: '17:00',
      duration: 60,
      description: 'Targeted chest, back, and arm supersets utilizing free weights and mechanical tension cables.',
      maxCapacity: 12,
      enrolledCount: 11,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: '65d1e5000000000000000004',
      title: 'Mobility & Athletic Longevity',
      workoutType: 'Personal Training',
      trainerId: trainer4Id,
      date: tomorrowStr,
      startTime: '18:30',
      duration: 50,
      description: 'Joint decompressions, thoracic spine rotations, and kinetic chain strengthening.',
      maxCapacity: 14,
      enrolledCount: 8,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
    {
      _id: '65d1e5000000000000000005',
      title: 'Endurance Row & Sprint Matrix',
      workoutType: 'Cardio',
      trainerId: trainer2Id,
      date: dayAfterStr,
      startTime: '08:00',
      duration: 45,
      description: 'Concept2 rowers, SkiErgs, and curved sprint treadmills circuit for VO2 max development.',
      maxCapacity: 16,
      enrolledCount: 7,
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    },
  ];

  const enquiries: EnquiryDoc[] = [
    {
      _id: '65d1f6000000000000000001',
      name: 'Robert Hayes',
      email: 'robert.h@outlook.com',
      phone: '+1 (555) 234-8899',
      subject: 'Inquiry regarding personal training packages',
      message: 'Hello, I am interested in booking a 3-month personal training block with Marcus for powerlifting prep. Could you share trainer availability?',
      status: 'pending',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '65d1f6000000000000000002',
      name: 'Jessica Gomez',
      email: 'jess.g@gmail.com',
      phone: '+1 (555) 876-1234',
      subject: 'Corporate gym membership inquiry',
      message: 'Does FLEXI offer corporate group discounts for a team of 15 employees? We work nearby in the tech district.',
      status: 'contacted',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '65d1f6000000000000000003',
      name: 'Kevin Zhao',
      email: 'kevin.zhao@domain.com',
      phone: '+1 (555) 333-7722',
      subject: 'Guest Pass & Weekend Hours',
      message: 'Are guest passes allowed on Sundays under the Quarterly Pro plan? Thank you!',
      status: 'resolved',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const appointments: AppointmentDoc[] = [
    {
      _id: '65d1a8000000000000000001',
      userId: member1Id,
      memberName: 'John Miller',
      memberEmail: 'john@example.com',
      memberPhone: '+1 (555) 349-1120',
      service: '1-on-1 Personal Training Session',
      trainerId: trainer1Id,
      trainerName: 'Marcus Vance',
      date: todayStr,
      timeSlot: '10:00 AM',
      duration: 60,
      notes: 'Focusing on deadlift lockout mechanics and lower back bracing.',
      status: 'confirmed',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '65d1a8000000000000000002',
      userId: member2Id,
      memberName: 'Sarah Jenkins',
      memberEmail: 'sarah.j@example.com',
      memberPhone: '+1 (555) 482-9901',
      service: 'InBody 570 Composition Analysis & Scan',
      trainerId: trainer2Id,
      trainerName: 'Elena Rostova',
      date: todayStr,
      timeSlot: '02:30 PM',
      duration: 30,
      notes: 'Quarterly body recomposition scan and visceral fat audit.',
      status: 'confirmed',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '65d1a8000000000000000003',
      userId: member3Id,
      memberName: 'Devon Patel',
      memberEmail: 'devon.p@example.com',
      memberPhone: '+1 (555) 781-6453',
      service: 'Biomechanics & Form Assessment',
      trainerId: trainer4Id,
      trainerName: 'Maya Patel',
      date: tomorrowStr,
      timeSlot: '11:30 AM',
      duration: 45,
      notes: 'Assessing left shoulder impingement during overhead pressing.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Attendance history seeds
  const attendance: AttendanceDoc[] = [
    {
      _id: '65d1att00000000000000001',
      userId: member1Id,
      memberName: 'John Miller',
      memberEmail: 'john@example.com',
      checkInTime: `${todayStr}T06:45:00.000Z`,
      date: todayStr,
      method: 'QR_SCAN',
      location: 'Turnstile A (Main Entrance)',
      status: 'Checked In',
    },
    {
      _id: '65d1att00000000000000002',
      userId: member2Id,
      memberName: 'Sarah Jenkins',
      memberEmail: 'sarah.j@example.com',
      checkInTime: `${todayStr}T07:15:00.000Z`,
      date: todayStr,
      method: 'QR_SCAN',
      location: 'Turnstile B (Cardio Zone)',
      status: 'Checked In',
    },
    {
      _id: '65d1att00000000000000003',
      userId: member1Id,
      memberName: 'John Miller',
      memberEmail: 'john@example.com',
      checkInTime: `${yesterdayStr}T06:50:00.000Z`,
      checkOutTime: `${yesterdayStr}T08:15:00.000Z`,
      date: yesterdayStr,
      method: 'QR_SCAN',
      location: 'Turnstile A (Main Entrance)',
      status: 'Completed',
    },
    {
      _id: '65d1att00000000000000004',
      userId: member3Id,
      memberName: 'Devon Patel',
      memberEmail: 'devon.p@example.com',
      checkInTime: `${yesterdayStr}T17:30:00.000Z`,
      checkOutTime: `${yesterdayStr}T19:00:00.000Z`,
      date: yesterdayStr,
      method: 'MANUAL_KIOSK',
      location: 'Front Desk Terminal',
      status: 'Completed',
    },
  ];

  // Fitness progress tracking seeds (with weight, BMI calculation)
  const fitnessProgress: FitnessProgressDoc[] = [
    {
      _id: '65d1prog0000000000000001',
      userId: member1Id,
      date: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
      weightKg: 84.5,
      heightCm: 180,
      bmi: Number((84.5 / ((1.80) ** 2)).toFixed(1)),
      bodyFatPercentage: 19.5,
      chestCm: 104,
      waistCm: 89,
      armsCm: 37,
      notes: 'Initial assessment scan. Clean bulking focus.',
      createdAt: new Date(now.getTime() - 28 * 86400000).toISOString(),
    },
    {
      _id: '65d1prog0000000000000002',
      userId: member1Id,
      date: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0],
      weightKg: 83.2,
      heightCm: 180,
      bmi: Number((83.2 / ((1.80) ** 2)).toFixed(1)),
      bodyFatPercentage: 18.2,
      chestCm: 105,
      waistCm: 86.5,
      armsCm: 37.5,
      notes: 'Waist reduction observed. Strength levels steady on bench.',
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      _id: '65d1prog0000000000000003',
      userId: member1Id,
      date: todayStr,
      weightKg: 82.0,
      heightCm: 180,
      bmi: Number((82.0 / ((1.80) ** 2)).toFixed(1)),
      bodyFatPercentage: 17.0,
      chestCm: 106,
      waistCm: 84.0,
      armsCm: 38.2,
      notes: 'Personal best deadlift 180kg achieved. Muscle definition peaking.',
      createdAt: now.toISOString(),
    },
    {
      _id: '65d1prog0000000000000004',
      userId: member2Id,
      date: thirtyDaysAgo.split('T')[0],
      weightKg: 66.0,
      heightCm: 168,
      bmi: Number((66.0 / ((1.68) ** 2)).toFixed(1)),
      bodyFatPercentage: 26.5,
      chestCm: 88,
      waistCm: 75,
      armsCm: 28,
      notes: 'Starting fat-loss conditioning phase.',
      createdAt: thirtyDaysAgo,
    },
    {
      _id: '65d1prog0000000000000005',
      userId: member2Id,
      date: todayStr,
      weightKg: 63.8,
      heightCm: 168,
      bmi: Number((63.8 / ((1.68) ** 2)).toFixed(1)),
      bodyFatPercentage: 24.0,
      chestCm: 87,
      waistCm: 71,
      armsCm: 28.5,
      notes: 'Down 2.2 kg. Feeling energetic for morning HIIT.',
      createdAt: now.toISOString(),
    },
  ];

  // Workout Plans seeds
  const workoutPlans: WorkoutPlanDoc[] = [
    {
      _id: '65d1wp000000000000000001',
      userId: member1Id,
      trainerId: trainer1Id,
      title: 'Power & Hypertrophy Split: Push Day A',
      dayOfWeek: 'Monday',
      category: 'Strength',
      difficulty: 'Advanced',
      notes: 'Ensure 3 minutes rest between working sets on heavy compound bench presses.',
      assignedDate: todayStr,
      status: 'active',
      createdAt: fifteenDaysAgo,
      updatedAt: fifteenDaysAgo,
      exercises: [
        { id: 'ex-1', name: 'Barbell Flat Bench Press', targetSets: 4, targetReps: '6-8 reps', restSeconds: 120, weightTargetKg: 100, completedSets: 4, isCompleted: true },
        { id: 'ex-2', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12 reps', restSeconds: 90, weightTargetKg: 32, completedSets: 3, isCompleted: true },
        { id: 'ex-3', name: 'Standing Overhead Barbell Press', targetSets: 3, targetReps: '8 reps', restSeconds: 90, weightTargetKg: 60, completedSets: 2, isCompleted: false },
        { id: 'ex-4', name: 'Cable Lateral Shoulder Raises', targetSets: 4, targetReps: '15 reps', restSeconds: 60, weightTargetKg: 12, completedSets: 0, isCompleted: false },
        { id: 'ex-5', name: 'Skull Crushers / Tricep Pushdowns', targetSets: 3, targetReps: '12 reps', restSeconds: 60, weightTargetKg: 35, completedSets: 0, isCompleted: false },
      ],
    },
    {
      _id: '65d1wp000000000000000002',
      userId: member1Id,
      trainerId: trainer1Id,
      title: 'Posterior Chain & Deadlift Focus',
      dayOfWeek: 'Wednesday',
      category: 'Strength',
      difficulty: 'Advanced',
      notes: 'Wear flat shoes, focus on hip hinge, drive through heels.',
      assignedDate: todayStr,
      status: 'active',
      createdAt: fifteenDaysAgo,
      updatedAt: fifteenDaysAgo,
      exercises: [
        { id: 'ex-6', name: 'Conventional Barbell Deadlift', targetSets: 4, targetReps: '5 reps', restSeconds: 180, weightTargetKg: 160, completedSets: 0, isCompleted: false },
        { id: 'ex-7', name: 'Weighted Pull-Ups', targetSets: 4, targetReps: '6-8 reps', restSeconds: 90, weightTargetKg: 15, completedSets: 0, isCompleted: false },
        { id: 'ex-8', name: 'Barbell Bent-Over Row', targetSets: 3, targetReps: '10 reps', restSeconds: 90, weightTargetKg: 80, completedSets: 0, isCompleted: false },
        { id: 'ex-9', name: 'Incline Dumbbell Bicep Curls', targetSets: 3, targetReps: '12 reps', restSeconds: 60, weightTargetKg: 16, completedSets: 0, isCompleted: false },
      ],
    },
  ];

  // Diet & Nutrition Plans
  const dietPlans: DietPlanDoc[] = [
    {
      _id: '65d1dp000000000000000001',
      userId: member1Id,
      trainerId: trainer1Id,
      targetCalories: 2600,
      targetProteinG: 185,
      targetCarbsG: 280,
      targetFatsG: 70,
      waterTargetMl: 3500,
      waterConsumedMl: 2200,
      date: todayStr,
      dietaryPreference: 'High Protein',
      createdAt: fifteenDaysAgo,
      updatedAt: todayStr,
      meals: [
        {
          id: 'meal-1',
          mealType: 'Breakfast',
          title: 'Rolled Oats with Whey, Blueberries & Almond Butter',
          calories: 620,
          proteinG: 48,
          carbsG: 72,
          fatsG: 16,
          isLogged: true,
          notes: 'Consumed at 7:30 AM after morning workout.',
        },
        {
          id: 'meal-2',
          mealType: 'Lunch',
          title: 'Grilled Lemon Herb Chicken Breast with Brown Basmati & Broccoli',
          calories: 710,
          proteinG: 55,
          carbsG: 82,
          fatsG: 14,
          isLogged: true,
          notes: 'High fiber, 250g cooked rice.',
        },
        {
          id: 'meal-3',
          mealType: 'Snack',
          title: 'Greek Yogurt (0%) with Chia Seeds & Honey',
          calories: 320,
          proteinG: 32,
          carbsG: 30,
          fatsG: 6,
          isLogged: false,
          notes: 'Pre-workout afternoon fuel.',
        },
        {
          id: 'meal-4',
          mealType: 'Dinner',
          title: 'Wild Atlantic Salmon Fillet with Roasted Sweet Potato & Asparagus',
          calories: 780,
          proteinG: 50,
          carbsG: 68,
          fatsG: 26,
          isLogged: false,
          notes: 'Omega-3 fatty acids for muscle recovery.',
        },
      ],
    },
  ];

  // Payments & Invoices
  const payments: PaymentDoc[] = [
    {
      _id: '65d1pay00000000000000001',
      userId: member1Id,
      memberName: 'John Miller',
      memberEmail: 'john@example.com',
      membershipId: '65d1d4000000000000000001',
      planName: 'Quarterly Pro Membership',
      amount: 129,
      currency: 'USD',
      status: 'paid',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-FLX-99812-US',
      invoiceNumber: 'INV-2026-0041',
      invoiceDate: fifteenDaysAgo,
      paidAt: fifteenDaysAgo,
      items: [
        { description: 'Quarterly Pro Membership (90 Days Access)', amount: 120 },
        { description: 'Club Access Keycard & Registration', amount: 9 },
      ],
      subtotal: 129,
      taxAmount: 0,
    },
    {
      _id: '65d1pay00000000000000002',
      userId: member2Id,
      memberName: 'Sarah Jenkins',
      memberEmail: 'sarah.j@example.com',
      membershipId: '65d1d4000000000000000002',
      planName: 'Monthly Pass Membership',
      amount: 49,
      currency: 'USD',
      status: 'paid',
      paymentMethod: 'Debit Card',
      transactionId: 'TXN-FLX-88219-US',
      invoiceNumber: 'INV-2026-0038',
      invoiceDate: thirtyDaysAgo,
      paidAt: thirtyDaysAgo,
      items: [
        { description: 'Monthly Pass (30 Days Gym Floor)', amount: 49 },
      ],
      subtotal: 49,
      taxAmount: 0,
    },
    {
      _id: '65d1pay00000000000000003',
      userId: member3Id,
      memberName: 'Devon Patel',
      memberEmail: 'devon.p@example.com',
      membershipId: '65d1d4000000000000000003',
      planName: 'Monthly Pass Renewal',
      amount: 49,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'UPI / Online',
      transactionId: 'TXN-PENDING-771',
      invoiceNumber: 'INV-2026-0055',
      invoiceDate: todayStr,
      dueDate: tomorrowStr,
      items: [
        { description: 'Monthly Pass Membership Renewal (Expired Account)', amount: 49 },
      ],
      subtotal: 49,
      taxAmount: 0,
    },
  ];

  // Gym Equipment
  const equipment: EquipmentDoc[] = [
    {
      _id: '65d1eq000000000000000001',
      name: 'Eleiko Olympic Competition Power Rack #1',
      category: 'Strength Machine',
      brand: 'Eleiko',
      serialNumber: 'ELK-PR-2024-001',
      location: 'Zone 1 - Free Weights Floor',
      condition: 'Excellent',
      lastServicedDate: '2026-02-10',
      nextServiceDueDate: '2026-05-10',
      technicianNotes: 'J-hooks and safety spotter pins lubricated; bolt torques verified.',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1eq000000000000000002',
      name: 'Life Fitness Hammer Strength Iso-Lateral Chest Press',
      category: 'Strength Machine',
      brand: 'Life Fitness',
      serialNumber: 'LF-HS-7892',
      location: 'Zone 2 - Pin & Plate Loaded',
      condition: 'Good',
      lastServicedDate: '2026-01-15',
      nextServiceDueDate: '2026-04-15',
      technicianNotes: 'Seat pneumatic adjustment lever replaced.',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1eq000000000000000003',
      name: 'Concept2 RowErg Model D (PM5)',
      category: 'Cardio',
      brand: 'Concept2',
      serialNumber: 'C2-ROW-99120',
      location: 'Cardio Loft / Row Zone',
      condition: 'Good',
      lastServicedDate: '2026-01-20',
      nextServiceDueDate: '2026-03-30',
      technicianNotes: 'Flywheel cleaned and nickel-plated chain oiled.',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1eq000000000000000004',
      name: 'Woodway 4Front Commercial Curved Treadmill',
      category: 'Cardio',
      brand: 'Woodway',
      serialNumber: 'WW-4F-3382',
      location: 'Cardio Loft - Sprint Alley',
      condition: 'Needs Maintenance',
      lastServicedDate: '2025-12-10',
      nextServiceDueDate: '2026-02-28',
      technicianNotes: 'Rubber slat belt minor friction noise at >18 km/h. Slat tension alignment scheduled.',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1eq000000000000000005',
      name: 'InBody 570 Body Composition Analyzer',
      category: 'Recovery',
      brand: 'InBody USA',
      serialNumber: 'INB-570-8823',
      location: 'Consultation & Testing Room 1',
      condition: 'Excellent',
      lastServicedDate: '2026-02-01',
      nextServiceDueDate: '2026-08-01',
      technicianNotes: 'Electrode impedance calibrated with manufacturer reference test.',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
  ];

  // Inventory / Pro Shop
  const inventory: InventoryDoc[] = [
    {
      _id: '65d1inv00000000000000001',
      name: 'Optimum Nutrition Gold Standard 100% Whey (Double Rich Chocolate 5lb)',
      category: 'Supplements',
      sku: 'SUPP-WHEY-CHO-5LB',
      price: 69.99,
      costPrice: 48.00,
      stockQuantity: 24,
      minThreshold: 10,
      unit: 'Tub',
      description: '24g protein per scoop with 5.5g naturally occurring BCAAs for muscle recovery.',
      imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1inv00000000000000002',
      name: 'Creapure Micronized Creatine Monohydrate (500g)',
      category: 'Supplements',
      sku: 'SUPP-CREA-500G',
      price: 34.99,
      costPrice: 20.00,
      stockQuantity: 6, // Low stock warning!
      minThreshold: 12,
      unit: 'Tub',
      description: 'Ultra-pure German Creapure for ATP replenishment and anaerobic power output.',
      imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1inv00000000000000003',
      name: 'FLEXI Heavy Duty Padded Figure-8 Lifting Straps',
      category: 'Accessories',
      sku: 'ACC-STRAP-FIG8',
      price: 19.99,
      costPrice: 7.50,
      stockQuantity: 45,
      minThreshold: 15,
      unit: 'Pair',
      description: 'Industrial dual-stitched cotton webbing for heavy deadlifts and shrugs.',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
    {
      _id: '65d1inv00000000000000004',
      name: 'FLEXI Matte Black Stainless Steel Shaker Bottle (750ml)',
      category: 'Accessories',
      sku: 'ACC-BTL-SS750',
      price: 24.99,
      costPrice: 9.00,
      stockQuantity: 3, // Critical low stock
      minThreshold: 10,
      unit: 'Piece',
      description: 'Double-walled vacuum insulated shaker keeping pre-workout ice cold for 24 hours.',
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
      createdAt: sixtyDaysAgo,
      updatedAt: sixtyDaysAgo,
    },
  ];

  // Feedback & Ratings
  const feedbacks: FeedbackDoc[] = [
    {
      _id: '65d1fb000000000000000001',
      userId: member1Id,
      memberName: 'John Miller',
      targetType: 'trainer',
      trainerId: trainer1Id,
      trainerName: 'Marcus Vance',
      rating: 5,
      comment: 'Marcus fixed my deadlift lockout in just two sessions. Outstanding cueing on hip hinge and lats engagement!',
      date: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      _id: '65d1fb000000000000000002',
      userId: member2Id,
      memberName: 'Sarah Jenkins',
      targetType: 'trainer',
      trainerId: trainer2Id,
      trainerName: 'Elena Rostova',
      rating: 5,
      comment: 'Elena brings tremendous energy to the morning HIIT sessions! Down 2.2 kg this month alone.',
      date: new Date(now.getTime() - 12 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
    },
    {
      _id: '65d1fb000000000000000003',
      userId: member1Id,
      memberName: 'John Miller',
      targetType: 'facility',
      rating: 5,
      comment: 'The Olympic lifting platforms and calibrated Eleiko plates make this the best gym in the metro area.',
      date: new Date(now.getTime() - 20 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
  ];

  // Member Goals & Milestones
  const memberGoals: MemberGoalDoc[] = [
    {
      _id: '65d1gl000000000000000001',
      userId: member1Id,
      title: 'Target Body Weight: 80.0 kg',
      category: 'Weight Loss',
      currentValue: 82.0,
      targetValue: 80.0,
      unit: 'kg',
      deadline: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: thirtyDaysAgo,
    },
    {
      _id: '65d1gl000000000000000002',
      userId: member1Id,
      title: 'Deadlift PR: 200 kg (4 Plates Club)',
      category: 'Personal Record',
      currentValue: 180,
      targetValue: 200,
      unit: 'kg',
      deadline: new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: thirtyDaysAgo,
    },
    {
      _id: '65d1gl000000000000000003',
      userId: member1Id,
      title: 'Monthly Workout Consistency (20 Sessions)',
      category: 'Consistency',
      currentValue: 18,
      targetValue: 20,
      unit: 'days',
      deadline: new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: fifteenDaysAgo,
    },
    {
      _id: '65d1gl000000000000000004',
      userId: member1Id,
      title: 'Bench Press PR: 100 kg (2 Plates)',
      category: 'Personal Record',
      currentValue: 100,
      targetValue: 100,
      unit: 'kg',
      deadline: todayStr,
      status: 'achieved',
      achievedAt: yesterdayStr,
      createdAt: thirtyDaysAgo,
    },
  ];

  // Gamification Challenges
  const challenges: ChallengeDoc[] = [
    {
      _id: '65d1ch000000000000000001',
      title: '30-Day Iron Discipline Streak',
      description: 'Check in and complete a verified workout at FLEXI for 30 consecutive days.',
      badgeName: 'Iron Lifter Badge',
      badgeIcon: 'Flame',
      category: 'Consistency',
      targetGoal: '30 Check-ins',
      durationDays: 30,
      points: 500,
      participantsCount: 84,
      isPopular: true,
    },
    {
      _id: '65d1ch000000000000000002',
      title: '100km Cardio Assault Quest',
      description: 'Log 100km accumulated distance across Concept2 rowers, SkiErgs, or Woodway treadmills.',
      badgeName: 'VO2 Max Beast',
      badgeIcon: 'Zap',
      category: 'Cardio',
      targetGoal: '100 Kilometers',
      durationDays: 45,
      points: 750,
      participantsCount: 62,
      isPopular: true,
    },
    {
      _id: '65d1ch000000000000000003',
      title: 'The 1000-Pound Club Challenge',
      description: 'Total combined 1RM of 1,000 lbs (453.6 kg) across Squat, Bench Press, and Deadlift.',
      badgeName: 'Century Titan',
      badgeIcon: 'Trophy',
      category: 'Strength',
      targetGoal: '1000 lbs Total',
      durationDays: 90,
      points: 1200,
      participantsCount: 31,
    },
    {
      _id: '65d1ch000000000000000004',
      title: 'Early Bird 06:00 AM Club',
      description: 'Scan your QR pass at the entrance turnstile before 07:00 AM at least 15 times this month.',
      badgeName: 'Dawn Warrior',
      badgeIcon: 'Award',
      category: 'Consistency',
      targetGoal: '15 Dawn Scans',
      durationDays: 30,
      points: 400,
      participantsCount: 47,
    },
  ];

  // In-App Notifications
  const notifications: NotificationDoc[] = [
    {
      _id: '65d1notif0000000000000001',
      userId: member1Id,
      title: 'Session Confirmed with Marcus Vance',
      message: 'Your 1-on-1 Personal Training Session is booked for today at 10:00 AM.',
      type: 'booking',
      isRead: false,
      link: '/book',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      _id: '65d1notif0000000000000002',
      userId: member1Id,
      title: 'Milestone Unlocked: 100kg Bench Press!',
      message: 'Congratulations! You achieved your milestone goal of 100kg Bench Press.',
      type: 'challenge',
      isRead: false,
      link: '/dashboard',
      createdAt: yesterdayStr,
    },
    {
      _id: '65d1notif0000000000000003',
      userId: member1Id,
      title: 'Payment Receipt Available',
      message: 'Invoice #INV-2026-0041 for Quarterly Pro ($129) is ready for download.',
      type: 'payment',
      isRead: true,
      link: '/dashboard',
      createdAt: fifteenDaysAgo,
    },
    {
      _id: '65d1notif0000000000000004',
      userId: member3Id,
      title: 'Action Required: Membership Expired',
      message: 'Your Monthly Pass expired 5 days ago. Renew today with promo code FLEXI10 for 10% off!',
      type: 'expiry',
      isRead: false,
      link: '/plans',
      createdAt: expiredDate,
    },
  ];

  return {
    users,
    plans,
    memberships,
    trainers,
    schedules,
    enquiries,
    appointments,
    attendance,
    fitnessProgress,
    workoutPlans,
    dietPlans,
    payments,
    equipment,
    inventory,
    feedbacks,
    memberGoals,
    challenges,
    notifications,
  };
}

export class DBStore {
  private data: DBData | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // On Vercel cold start: copy bundled source JSON to writable /tmp if not already there
      if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(SOURCE_DB_FILE)) {
        fs.copyFileSync(SOURCE_DB_FILE, DB_FILE);
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist gracefully
        const initial = await createInitialData();
        const mergedUsers = [...(parsed.users || initial.users)];
        initial.users.forEach(initUser => {
          if (!mergedUsers.some(u => u.email.toLowerCase() === initUser.email.toLowerCase())) {
            mergedUsers.push(initUser);
          }
        });

        this.data = {
          users: mergedUsers,
          plans: parsed.plans || initial.plans,
          memberships: parsed.memberships || initial.memberships,
          trainers: parsed.trainers || initial.trainers,
          schedules: parsed.schedules || initial.schedules,
          enquiries: parsed.enquiries || initial.enquiries,
          appointments: parsed.appointments || initial.appointments,
          attendance: parsed.attendance || initial.attendance,
          fitnessProgress: parsed.fitnessProgress || initial.fitnessProgress,
          workoutPlans: parsed.workoutPlans || initial.workoutPlans,
          dietPlans: parsed.dietPlans || initial.dietPlans,
          payments: parsed.payments || initial.payments,
          equipment: parsed.equipment || initial.equipment,
          inventory: parsed.inventory || initial.inventory,
          feedbacks: parsed.feedbacks || initial.feedbacks,
          memberGoals: parsed.memberGoals || initial.memberGoals,
          challenges: parsed.challenges || initial.challenges,
          notifications: parsed.notifications || initial.notifications,
        };
        this.save();
      } else {
        this.data = await createInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB file, re-initializing store:', err);
      this.data = await createInitialData();
      this.save();
    }
  }

  public async getDB(): Promise<DBData> {
    if (this.initPromise) {
      await this.initPromise;
    }

    // If MongoDB is connected, load live collections from MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const [
          users, plans, memberships, trainers, schedules, enquiries,
          appointments, attendance, fitnessProgress, workoutPlans,
          dietPlans, payments, equipment, inventory, feedbacks,
          memberGoals, challenges, notifications
        ] = await Promise.all([
          User.find().lean(),
          MembershipPlan.find().lean(),
          Membership.find().lean(),
          Trainer.find().lean(),
          WorkoutSchedule.find().lean(),
          Enquiry.find().lean(),
          Appointment.find().lean(),
          Attendance.find().lean(),
          FitnessProgress.find().lean(),
          WorkoutPlan.find().lean(),
          DietPlan.find().lean(),
          Payment.find().lean(),
          Equipment.find().lean(),
          Inventory.find().lean(),
          Feedback.find().lean(),
          MemberGoal.find().lean(),
          Challenge.find().lean(),
          Notification.find().lean(),
        ]);

        if (users.length > 0) {
          this.data = {
            users: users as any,
            plans: plans as any,
            memberships: memberships as any,
            trainers: trainers as any,
            schedules: schedules as any,
            enquiries: enquiries as any,
            appointments: appointments as any,
            attendance: attendance as any,
            fitnessProgress: fitnessProgress as any,
            workoutPlans: workoutPlans as any,
            dietPlans: dietPlans as any,
            payments: payments as any,
            equipment: equipment as any,
            inventory: inventory as any,
            feedbacks: feedbacks as any,
            memberGoals: memberGoals as any,
            challenges: challenges as any,
            notifications: notifications as any,
          };
          return this.data;
        }
      } catch (err) {
        console.warn('Live MongoDB query encountered an issue, reading local store:', err);
      }
    }

    return this.data!;
  }

  public async syncToMongo(): Promise<void> {
    if (mongoose.connection.readyState !== 1 || !this.data) return;
    try {
      const collections: Array<{ model: any; docs: any[] }> = [
        { model: User, docs: this.data.users },
        { model: MembershipPlan, docs: this.data.plans },
        { model: Membership, docs: this.data.memberships },
        { model: Trainer, docs: this.data.trainers },
        { model: WorkoutSchedule, docs: this.data.schedules },
        { model: Enquiry, docs: this.data.enquiries },
        { model: Appointment, docs: this.data.appointments },
        { model: Attendance, docs: this.data.attendance },
        { model: FitnessProgress, docs: this.data.fitnessProgress },
        { model: WorkoutPlan, docs: this.data.workoutPlans },
        { model: DietPlan, docs: this.data.dietPlans },
        { model: Payment, docs: this.data.payments },
        { model: Equipment, docs: this.data.equipment },
        { model: Inventory, docs: this.data.inventory },
        { model: Feedback, docs: this.data.feedbacks },
        { model: MemberGoal, docs: this.data.memberGoals },
        { model: Challenge, docs: this.data.challenges },
        { model: Notification, docs: this.data.notifications },
      ];

      for (const { model, docs } of collections) {
        if (!docs || docs.length === 0) continue;
        try {
          const ops = docs.map(doc => ({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          }));
          await model.bulkWrite(ops, { ordered: false });
        } catch (innerErr: any) {
          // Log per-collection errors but never crash the server
          console.warn(`⚠️  Sync warning for ${model.modelName}: ${innerErr.message}`);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync to MongoDB:', err.message);
    }
  }

  public save(): void {
    if (!this.data) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to DB_FILE:', err);
    }

    // If MongoDB is connected, also sync changes directly to MongoDB
    if (mongoose.connection.readyState === 1) {
      this.syncToMongo().catch(err => {
        console.error('Async sync to MongoDB failed:', err);
      });
    }
  }

  public async resetToSeed(): Promise<DBData> {
    this.data = await createInitialData();
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
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
        await this.syncToMongo();
      } catch (err: any) {
        console.error('Failed to reset MongoDB seeds:', err.message);
      }
    }

    return this.data;
  }
}

export const dbStore = new DBStore();
