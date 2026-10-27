import mongoose, { Schema, Document } from 'mongoose';

// Helper to generate a 24-character hex ObjectId string
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + random).substring(0, 24);
}

// 1. User Model
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'admin' | 'member' | 'trainer';
  trainerId?: string;
  assignedTrainerId?: string;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'member', 'trainer'], default: 'member' },
  trainerId: { type: String },
  assignedTrainerId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false, timestamps: false });

export const User = mongoose.model<IUser>('User', UserSchema);

// 2. Membership Plan Model
export interface IMembershipPlan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  benefits: string[];
  workoutAccess: string;
  trainerSupport: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const MembershipPlanSchema = new Schema<IMembershipPlan>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  description: { type: String, default: '' },
  benefits: { type: [String], default: [] },
  workoutAccess: { type: String, default: 'All open gym hours' },
  trainerSupport: { type: String, default: 'General floor coaches available' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', MembershipPlanSchema);

// 3. Membership Model
export interface IMembership {
  _id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  paymentMethod?: string;
  amountPaid?: number;
  autoRenew?: boolean;
  renewalDiscountApplied?: boolean;
  createdAt: string;
  updatedAt: string;
}

const MembershipSchema = new Schema<IMembership>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  planId: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  paymentMethod: { type: String },
  amountPaid: { type: Number },
  autoRenew: { type: Boolean, default: false },
  renewalDiscountApplied: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);

// 4. Trainer Model
export interface ITrainer {
  _id: string;
  name: string;
  photoUrl: string;
  specialization: string;
  experience: string;
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

const TrainerSchema = new Schema<ITrainer>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  specialization: { type: String, default: 'General Fitness' },
  experience: { type: String, default: '5+ Years' },
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  email: { type: String },
  phone: { type: String },
  hourlyRate: { type: Number, default: 50 },
  rating: { type: Number, default: 5.0 },
  totalReviews: { type: Number, default: 0 },
  availableDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  availableSlots: { type: [String], default: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Trainer = mongoose.model<ITrainer>('Trainer', TrainerSchema);

// 5. Workout Schedule Model
export interface IWorkoutSchedule {
  _id: string;
  title: string;
  workoutType: string;
  trainerId: string;
  date: string;
  startTime: string;
  duration: number;
  description: string;
  maxCapacity?: number;
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}

const WorkoutScheduleSchema = new Schema<IWorkoutSchedule>({
  _id: { type: String, default: generateObjectId },
  title: { type: String, required: true },
  workoutType: { type: String, required: true },
  trainerId: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  description: { type: String, default: '' },
  maxCapacity: { type: Number, default: 20 },
  enrolledCount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const WorkoutSchedule = mongoose.model<IWorkoutSchedule>('WorkoutSchedule', WorkoutScheduleSchema);

// 6. Enquiry Model
export interface IEnquiry {
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

const EnquirySchema = new Schema<IEnquiry>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'contacted', 'resolved'], default: 'pending' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

// 7. Appointment Model
export interface IAppointment {
  _id: string;
  userId?: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  service: string;
  trainerId?: string;
  trainerName?: string;
  date: string;
  timeSlot: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const AppointmentSchema = new Schema<IAppointment>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String },
  memberName: { type: String, required: true },
  memberEmail: { type: String, required: true },
  memberPhone: { type: String, default: '' },
  service: { type: String, required: true },
  trainerId: { type: String },
  trainerName: { type: String },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  duration: { type: Number, default: 60 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);

// 8. Attendance Model
export interface IAttendance {
  _id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  method: string;
  location: string;
  status: string;
}

const AttendanceSchema = new Schema<IAttendance>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  memberName: { type: String, required: true },
  memberEmail: { type: String, required: true },
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String },
  date: { type: String, required: true },
  method: { type: String, default: 'QR_SCAN' },
  location: { type: String, default: 'Main Gym Floor Turnstile' },
  status: { type: String, default: 'Checked In' },
}, { _id: false });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

// 9. Fitness Progress Model
export interface IFitnessProgress {
  _id: string;
  userId: string;
  date: string;
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

const FitnessProgressSchema = new Schema<IFitnessProgress>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  weightKg: { type: Number, required: true },
  heightCm: { type: Number, required: true },
  bmi: { type: Number, required: true },
  bodyFatPercentage: { type: Number },
  chestCm: { type: Number },
  waistCm: { type: Number },
  armsCm: { type: Number },
  notes: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const FitnessProgress = mongoose.model<IFitnessProgress>('FitnessProgress', FitnessProgressSchema);

// 10. Workout Plan Model
const ExerciseItemSchema = new Schema({
  id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  targetSets: { type: Number, default: 3 },
  targetReps: { type: String, default: '10-12' },
  restSeconds: { type: Number, default: 60 },
  weightTargetKg: { type: Number },
  completedSets: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
}, { _id: false });

export interface IWorkoutPlan {
  _id: string;
  userId: string;
  trainerId?: string;
  title: string;
  dayOfWeek: string;
  category: string;
  difficulty: string;
  exercises: any[];
  notes?: string;
  assignedDate: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const WorkoutPlanSchema = new Schema<IWorkoutPlan>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  trainerId: { type: String },
  title: { type: String, required: true },
  dayOfWeek: { type: String, default: 'Daily' },
  category: { type: String, default: 'Strength' },
  difficulty: { type: String, default: 'Intermediate' },
  exercises: { type: [ExerciseItemSchema], default: [] },
  notes: { type: String },
  assignedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const WorkoutPlan = mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);

// 11. Diet Plan Model
const MealItemSchema = new Schema({
  id: { type: String, default: generateObjectId },
  mealType: { type: String, default: 'Breakfast' },
  title: { type: String, required: true },
  calories: { type: Number, default: 0 },
  proteinG: { type: Number, default: 0 },
  carbsG: { type: Number, default: 0 },
  fatsG: { type: Number, default: 0 },
  isLogged: { type: Boolean, default: false },
  notes: { type: String },
}, { _id: false });

export interface IDietPlan {
  _id: string;
  userId: string;
  trainerId?: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  waterTargetMl: number;
  waterConsumedMl: number;
  date: string;
  meals: any[];
  dietaryPreference?: string;
  createdAt: string;
  updatedAt: string;
}

const DietPlanSchema = new Schema<IDietPlan>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  trainerId: { type: String },
  targetCalories: { type: Number, default: 2200 },
  targetProteinG: { type: Number, default: 160 },
  targetCarbsG: { type: Number, default: 220 },
  targetFatsG: { type: Number, default: 70 },
  waterTargetMl: { type: Number, default: 3500 },
  waterConsumedMl: { type: Number, default: 0 },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  meals: { type: [MealItemSchema], default: [] },
  dietaryPreference: { type: String, default: 'High Protein' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const DietPlan = mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);

// 12. Payment Model
export interface IPayment {
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

const PaymentSchema = new Schema<IPayment>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  memberName: { type: String, required: true },
  memberEmail: { type: String, required: true },
  membershipId: { type: String },
  planId: { type: String },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['paid', 'pending', 'refunded'], default: 'paid' },
  paymentMethod: { type: String, default: 'Credit Card' },
  transactionId: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: String, required: true },
  dueDate: { type: String },
  paidAt: { type: String },
  items: { type: [{ description: String, amount: Number }], default: [] },
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

// 13. Equipment Model
export interface IEquipment {
  _id: string;
  name: string;
  category: string;
  brand: string;
  serialNumber: string;
  location: string;
  condition: string;
  lastServicedDate: string;
  nextServiceDueDate: string;
  technicianNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const EquipmentSchema = new Schema<IEquipment>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, default: '' },
  serialNumber: { type: String, default: '' },
  location: { type: String, default: 'Main Gym Floor' },
  condition: { type: String, default: 'Excellent' },
  lastServicedDate: { type: String, default: '' },
  nextServiceDueDate: { type: String, default: '' },
  technicianNotes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Equipment = mongoose.model<IEquipment>('Equipment', EquipmentSchema);

// 14. Inventory Model
export interface IInventory {
  _id: string;
  name: string;
  category: string;
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

const InventorySchema = new Schema<IInventory>({
  _id: { type: String, default: generateObjectId },
  name: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 5 },
  unit: { type: String, default: 'Unit' },
  description: { type: String, default: '' },
  imageUrl: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);

// 15. Feedback Model
export interface IFeedback {
  _id: string;
  userId: string;
  memberName: string;
  targetType: string;
  trainerId?: string;
  trainerName?: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
}

const FeedbackSchema = new Schema<IFeedback>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true },
  memberName: { type: String, required: true },
  targetType: { type: String, default: 'facility' },
  trainerId: { type: String },
  trainerName: { type: String },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

// 16. Member Goal Model
export interface IMemberGoal {
  _id: string;
  userId: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
  status: 'in_progress' | 'achieved';
  achievedAt?: string;
  createdAt: string;
}

const MemberGoalSchema = new Schema<IMemberGoal>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Weight Loss' },
  currentValue: { type: Number, default: 0 },
  targetValue: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  deadline: { type: String, required: true },
  status: { type: String, enum: ['in_progress', 'achieved'], default: 'in_progress' },
  achievedAt: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const MemberGoal = mongoose.model<IMemberGoal>('MemberGoal', MemberGoalSchema);

// 17. Challenge Model
export interface IChallenge {
  _id: string;
  title: string;
  description: string;
  badgeName: string;
  badgeIcon: string;
  category: string;
  targetGoal: string;
  durationDays: number;
  points: number;
  participantsCount: number;
  isPopular?: boolean;
}

const ChallengeSchema = new Schema<IChallenge>({
  _id: { type: String, default: generateObjectId },
  title: { type: String, required: true },
  description: { type: String, required: true },
  badgeName: { type: String, required: true },
  badgeIcon: { type: String, default: 'Flame' },
  category: { type: String, default: 'Consistency' },
  targetGoal: { type: String, required: true },
  durationDays: { type: Number, default: 30 },
  points: { type: Number, default: 500 },
  participantsCount: { type: Number, default: 0 },
  isPopular: { type: Boolean, default: false },
}, { _id: false });

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);

// 18. Notification Model
export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: String, default: generateObjectId },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'system' },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

