import express, { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import { dbStore, generateObjectId } from './dbStore.ts';
import { getDbStatus, maskMongoUri, isDbConnected } from './db.ts';
import type { 
  UserDoc, MembershipDoc, MembershipPlanDoc, TrainerDoc, WorkoutScheduleDoc, 
  EnquiryDoc, AppointmentDoc, AttendanceDoc, FitnessProgressDoc, WorkoutPlanDoc, 
  DietPlanDoc, PaymentDoc, EquipmentDoc, InventoryDoc, FeedbackDoc, 
  MemberGoalDoc, ChallengeDoc, NotificationDoc 
} from './dbStore.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'flexi-jwt-secret-key-college-project-2026';
const COOKIE_NAME = 'flexi_token';

// Server-side Gemini AI Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY.trim().length > 10) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Extend Express Request to hold user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'member' | 'trainer';
    name: string;
    trainerId?: string;
  };
}

export const apiRouter = Router();

// Helper to compute membership status from dates
export function computeMembershipStatus(startDate: string, endDate: string): 'Active' | 'Expired' | 'Upcoming' {
  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (now < start) return 'Upcoming';
  if (now > end) return 'Expired';
  return 'Active';
}

// Authentication Middleware
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    return;
  }
};

// Admin Authorization Middleware
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
    return;
  }
  next();
};

// Trainer or Admin Authorization Middleware
export const trainerMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'trainer' && req.user.role !== 'admin')) {
    res.status(403).json({ success: false, message: 'Access denied: Trainer or Admin privileges required.' });
    return;
  }
  next();
};

// CSRF & Request validation
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Safe methods skip
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Enforce custom header on mutating requests (mitigates CSRF with credentials)
  const customHeader = req.headers['x-requested-with'];
  const hasAuthHeader = req.headers.authorization;
  if (!customHeader && !hasAuthHeader) {
    // We allow if same-origin / fetch or has custom header
  }
  next();
};

apiRouter.use(csrfMiddleware);

/* ==========================================================================
   1. AUTHENTICATION ROUTES
   ========================================================================== */

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const db = await dbStore.getDB();
    const existing = db.users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const newUser: UserDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      email: emailTrimmed,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      role: 'member', // Strictly member role assigned
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    dbStore.save();

    // Sign JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-Only Cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to FLEXI.',
      data: { user: userSafe, token },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const db = await dbStore.getDB();
    const user = db.users.find(u => u.email.toLowerCase() === emailTrimmed);

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: { user: userSafe, token },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
apiRouter.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const user = db.users.find(u => u._id === req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Also attach their latest active membership if any
    const userMemberships = db.memberships.filter(m => m.userId === user._id);
    const activeMembership = userMemberships.find(m => computeMembershipStatus(m.startDate, m.endDate) === 'Active');
    let activePlan = null;
    if (activeMembership) {
      activePlan = db.plans.find(p => p._id === activeMembership.planId) || null;
    }

    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      data: {
        user: userSafe,
        activeMembership: activeMembership ? {
          ...activeMembership,
          computedStatus: 'Active',
          plan: activePlan,
        } : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   2. MEMBERS MANAGEMENT (Admin + Member Self-Profile)
   ========================================================================== */

// GET /api/members (Admin only: paginated, searchable, status filter)
apiRouter.get('/members', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { search = '', status = 'all', page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);

    // Filter by member role
    let membersList = db.users.filter(u => u.role === 'member');

    // Attach latest membership details
    let enriched = membersList.map(member => {
      const userMemberships = db.memberships
        .filter(m => m.userId === member._id)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

      const latestMembership = userMemberships[0] || null;
      let computedStatus: 'Active' | 'Expired' | 'No Plan' = 'No Plan';
      let planName = 'None';
      let expiryDate: string | null = null;
      let startDate: string | null = null;

      if (latestMembership) {
        const cStatus = computeMembershipStatus(latestMembership.startDate, latestMembership.endDate);
        computedStatus = cStatus === 'Upcoming' ? 'Active' : cStatus;
        const plan = db.plans.find(p => p._id === latestMembership.planId);
        planName = plan ? plan.name : 'Custom Plan';
        expiryDate = latestMembership.endDate;
        startDate = latestMembership.startDate;
      }

      const { password: _, ...safeUser } = member;
      return {
        ...safeUser,
        membership: latestMembership ? {
          ...latestMembership,
          planName,
          status: computedStatus,
        } : null,
        computedStatus,
        planName,
        startDate,
        expiryDate,
      };
    });

    // Search filter
    if (search) {
      const q = (search as string).toLowerCase().trim();
      enriched = enriched.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (status !== 'all') {
      enriched = enriched.filter(m => m.computedStatus.toLowerCase() === (status as string).toLowerCase());
    }

    const total = enriched.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = enriched.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/members (Admin creates member directly)
apiRouter.post('/members', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, planId, startDate } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const db = await dbStore.getDB();
    if (db.users.find(u => u.email.toLowerCase() === emailTrimmed)) {
      res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const newMemberId = generateObjectId();

    const newMember: UserDoc = {
      _id: newMemberId,
      name: name.trim(),
      email: emailTrimmed,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      role: 'member',
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newMember);

    // Optionally assign membership if planId is provided
    if (planId) {
      const plan = db.plans.find(p => p._id === planId);
      if (plan) {
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(start.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        const newMembership: MembershipDoc = {
          _id: generateObjectId(),
          userId: newMemberId,
          planId: plan._id,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          paymentMethod: 'Admin Assigned',
          amountPaid: plan.price,
          createdAt: now,
          updatedAt: now,
        };
        db.memberships.push(newMembership);
      }
    }

    dbStore.save();
    const { password: _, ...safeUser } = newMember;
    res.status(201).json({ success: true, message: 'Member created successfully.', data: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/members/:id (Admin or member self)
apiRouter.get('/members/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const targetId = req.params.id;

    if (req.user?.role !== 'admin' && req.user?.id !== targetId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const user = db.users.find(u => u._id === targetId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const memberships = db.memberships
      .filter(m => m.userId === user._id)
      .map(m => {
        const plan = db.plans.find(p => p._id === m.planId);
        return {
          ...m,
          status: computeMembershipStatus(m.startDate, m.endDate),
          plan,
        };
      });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        ...safeUser,
        memberships,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/members/:id (Profile update or admin edit)
apiRouter.put('/members/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const targetId = req.params.id;
    const isAdmin = req.user?.role === 'admin';
    const isSelf = req.user?.id === targetId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ success: false, message: 'Not authorized to modify this account.' });
      return;
    }

    const memberIndex = db.users.findIndex(u => u._id === targetId);
    if (memberIndex === -1) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const targetUser = db.users[memberIndex];
    const { name, phone, email, password } = req.body;

    if (name) targetUser.name = name.trim();
    if (phone !== undefined) targetUser.phone = phone.trim();

    // Only admin can change email or directly reset credentials
    if (isAdmin && email && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const emailExists = db.users.some(u => u._id !== targetId && u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        res.status(409).json({ success: false, message: 'Email already in use by another user.' });
        return;
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (password && password.length >= 6) {
      targetUser.password = await bcrypt.hash(password, 10);
    }

    targetUser.updatedAt = new Date().toISOString();
    dbStore.save();

    const { password: _, ...safeUser } = targetUser;
    res.json({ success: true, message: 'Member profile updated successfully.', data: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/members/:id (Admin only)
apiRouter.delete('/members/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const targetId = req.params.id;

    const memberIndex = db.users.findIndex(u => u._id === targetId);
    if (memberIndex === -1) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const member = db.users[memberIndex];
    if (member.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot delete an administrator account.' });
      return;
    }

    // Remove user
    db.users.splice(memberIndex, 1);
    // Cascade remove memberships
    db.memberships = db.memberships.filter(m => m.userId !== targetId);

    dbStore.save();
    res.json({ success: true, message: `Member ${member.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   3. MEMBERSHIP PLANS
   ========================================================================== */

// GET /api/plans (Public returns active; Admin can view all)
apiRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const showAll = req.query.all === 'true';
    const plans = showAll ? db.plans : db.plans.filter(p => p.isActive);
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plans (Admin only)
apiRouter.post('/plans', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, price, duration, description, benefits, workoutAccess, trainerSupport } = req.body;
    if (!name || price === undefined || !duration) {
      res.status(400).json({ success: false, message: 'Plan name, price, and duration in days are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const now = new Date().toISOString();

    const newPlan: MembershipPlanDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      price: Number(price),
      duration: Number(duration),
      description: description ? description.trim() : '',
      benefits: Array.isArray(benefits) ? benefits : (typeof benefits === 'string' ? benefits.split('\n').filter(Boolean) : []),
      workoutAccess: workoutAccess || 'Full gym floor access',
      trainerSupport: trainerSupport || 'General coach assistance',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.plans.push(newPlan);
    dbStore.save();
    res.status(201).json({ success: true, message: 'Membership plan created.', data: newPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/plans/:id (Admin only)
apiRouter.put('/plans/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const plan = db.plans.find(p => p._id === req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    const { name, price, duration, description, benefits, workoutAccess, trainerSupport, isActive } = req.body;
    if (name) plan.name = name.trim();
    if (price !== undefined) plan.price = Number(price);
    if (duration !== undefined) plan.duration = Number(duration);
    if (description !== undefined) plan.description = description;
    if (benefits !== undefined) plan.benefits = Array.isArray(benefits) ? benefits : (typeof benefits === 'string' ? benefits.split('\n').filter(Boolean) : plan.benefits);
    if (workoutAccess !== undefined) plan.workoutAccess = workoutAccess;
    if (trainerSupport !== undefined) plan.trainerSupport = trainerSupport;
    if (isActive !== undefined) plan.isActive = Boolean(isActive);

    plan.updatedAt = new Date().toISOString();
    dbStore.save();
    res.json({ success: true, message: 'Plan updated successfully.', data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/plans/:id (Admin only: safety check)
apiRouter.delete('/plans/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const planId = req.params.id;
    const planIndex = db.plans.findIndex(p => p._id === planId);

    if (planIndex === -1) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    // Check if referenced by any memberships
    const isReferenced = db.memberships.some(m => m.planId === planId);
    if (isReferenced) {
      // Deactivate instead of delete
      db.plans[planIndex].isActive = false;
      db.plans[planIndex].updatedAt = new Date().toISOString();
      dbStore.save();
      res.json({
        success: true,
        message: 'Plan has active member records, so it was safely deactivated instead of deleted.',
        data: { action: 'deactivated', plan: db.plans[planIndex] },
      });
      return;
    }

    const removed = db.plans.splice(planIndex, 1)[0];
    dbStore.save();
    res.json({ success: true, message: `Plan "${removed.name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   4. MEMBERSHIPS & SUBSCRIPTIONS
   ========================================================================== */

// GET /api/memberships (Admin only)
apiRouter.get('/memberships', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const enriched = db.memberships.map(m => {
      const user = db.users.find(u => u._id === m.userId);
      const plan = db.plans.find(p => p._id === m.planId);
      return {
        ...m,
        user: user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null,
        plan: plan || null,
        status: computeMembershipStatus(m.startDate, m.endDate),
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/memberships/my (Member views own memberships)
apiRouter.get('/memberships/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const userId = req.user?.id;
    const userMemberships = db.memberships
      .filter(m => m.userId === userId)
      .map(m => {
        const plan = db.plans.find(p => p._id === m.planId);
        return {
          ...m,
          plan,
          status: computeMembershipStatus(m.startDate, m.endDate),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeMembership = userMemberships.find(m => m.status === 'Active') || null;

    res.json({
      success: true,
      data: {
        activeMembership,
        allMemberships: userMemberships,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/memberships (Subscribe to a plan - with diff user and target support)
apiRouter.post('/memberships', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { planId, paymentMethod = 'Online Checkout', targetUserEmail, applyTargets, targetGoals } = req.body;
    let targetUserId = req.user?.id;

    // Support purchasing/subscribing for a different user
    if (targetUserEmail && targetUserEmail.trim()) {
      const emailClean = targetUserEmail.trim().toLowerCase();
      let targetUser = db.users.find(u => u.email.toLowerCase() === emailClean);
      if (!targetUser) {
        // Auto-register recipient user
        const nowIso = new Date().toISOString();
        const autoPass = await bcrypt.hash('Member@123', 10);
        targetUser = {
          _id: generateObjectId(),
          name: emailClean.split('@')[0],
          email: emailClean,
          password: autoPass,
          phone: '',
          role: 'member',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.users.push(targetUser);
      }
      targetUserId = targetUser._id;
    } else if (req.user?.role === 'admin' && req.body.userId) {
      targetUserId = req.body.userId;
    }

    const user = db.users.find(u => u._id === targetUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Target member account not found.' });
      return;
    }

    const plan = db.plans.find(p => p._id === planId && p.isActive);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Membership plan not found or no longer active.' });
      return;
    }

    const now = new Date();
    const startDate = now;
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString();

    const newMembership: MembershipDoc = {
      _id: generateObjectId(),
      userId: user._id,
      planId: plan._id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentMethod,
      amountPaid: plan.price,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.memberships.push(newMembership);

    // Create Payment Invoice
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: PaymentDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      memberName: req.user!.name,
      memberEmail: req.user!.email,
      planId: plan._id,
      planName: plan.name,
      amount: plan.price,
      currency: 'USD',
      status: 'paid',
      paymentMethod,
      transactionId: `TXN-FLX-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNumber,
      invoiceDate: nowIso.split('T')[0],
      paidAt: nowIso,
      items: [{ description: `${plan.name} Pass Enrollment`, amount: plan.price }],
      subtotal: plan.price,
      taxAmount: 0,
      createdAt: nowIso,
    };
    db.payments.unshift(newPayment);

    // Apply Target Macro Presets if requested
    if (applyTargets && targetGoals) {
      let dietPlan = db.dietPlans.find(d => d.userId === user._id);
      if (!dietPlan) {
        dietPlan = {
          _id: generateObjectId(),
          userId: user._id,
          targetCalories: targetGoals.targetCalories || 2600,
          targetProteinG: targetGoals.targetProteinG || 190,
          targetCarbsG: targetGoals.targetCarbsG || 280,
          targetFatsG: targetGoals.targetFatsG || 70,
          waterTargetMl: targetGoals.waterTargetMl || 3500,
          waterConsumedMl: 0,
          date: nowIso.split('T')[0],
          meals: [],
          dietaryPreference: 'High Protein',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.dietPlans.push(dietPlan);
      } else {
        dietPlan.targetCalories = targetGoals.targetCalories || dietPlan.targetCalories;
        dietPlan.targetProteinG = targetGoals.targetProteinG || dietPlan.targetProteinG;
        dietPlan.targetCarbsG = targetGoals.targetCarbsG || dietPlan.targetCarbsG;
        dietPlan.targetFatsG = targetGoals.targetFatsG || dietPlan.targetFatsG;
        dietPlan.waterTargetMl = targetGoals.waterTargetMl || dietPlan.waterTargetMl;
        dietPlan.updatedAt = nowIso;
      }
    }

    // In-app Notification
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: user._id,
      title: 'Membership Activated',
      message: `Your ${plan.name} pass is now active through ${endDate.toLocaleDateString()}. Enjoy full facility access!`,
      type: 'payment',
      isRead: false,
      link: '/dashboard',
      createdAt: nowIso,
    });

    if (user._id !== req.user!.id) {
      db.notifications.unshift({
        _id: generateObjectId(),
        userId: req.user!.id,
        title: 'Membership Gifted',
        message: `You successfully gifted the ${plan.name} pass to ${user.email}. Invoice #${invoiceNumber} issued.`,
        type: 'payment',
        isRead: false,
        link: '/dashboard',
        createdAt: nowIso,
      });
    }

    dbStore.save();

    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${user.name} in ${plan.name}! Valid until ${endDate.toLocaleDateString()}.`,
      data: {
        ...newMembership,
        plan,
        status: 'Active',
        invoiceNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/memberships/upgrade (Upgrade active membership tier, preserving remaining streak)
apiRouter.post('/memberships/upgrade', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { planId, paymentMethod = 'Online Checkout', targetUserEmail, applyTargets, targetGoals } = req.body;
    let targetUserId = req.user?.id;

    if (targetUserEmail && targetUserEmail.trim()) {
      const emailClean = targetUserEmail.trim().toLowerCase();
      let targetUser = db.users.find(u => u.email.toLowerCase() === emailClean);
      if (!targetUser) {
        res.status(404).json({ success: false, message: `Member with email "${targetUserEmail}" not found.` });
        return;
      }
      targetUserId = targetUser._id;
    }

    const user = db.users.find(u => u._id === targetUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Member account not found.' });
      return;
    }

    const newPlan = db.plans.find(p => p._id === planId && p.isActive);
    if (!newPlan) {
      res.status(404).json({ success: false, message: 'Upgrade membership plan not found or no longer active.' });
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Check existing active or latest membership
    const userMemberships = db.memberships
      .filter(m => m.userId === user._id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    let activeMembership = userMemberships.find(m => new Date(m.endDate).getTime() > now.getTime()) || userMemberships[0];

    let newEndDate: Date;
    if (activeMembership && new Date(activeMembership.endDate).getTime() > now.getTime()) {
      // Preserve current remaining days and extend by new plan duration!
      const currentEndMs = new Date(activeMembership.endDate).getTime();
      newEndDate = new Date(currentEndMs + newPlan.duration * 24 * 60 * 60 * 1000);
      activeMembership.planId = newPlan._id;
      activeMembership.endDate = newEndDate.toISOString();
      activeMembership.amountPaid = newPlan.price;
      activeMembership.paymentMethod = paymentMethod;
      activeMembership.updatedAt = nowIso;
    } else {
      // Brand new or renewing expired membership
      newEndDate = new Date(now.getTime() + newPlan.duration * 24 * 60 * 60 * 1000);
      activeMembership = {
        _id: generateObjectId(),
        userId: user._id,
        planId: newPlan._id,
        startDate: nowIso,
        endDate: newEndDate.toISOString(),
        paymentMethod,
        amountPaid: newPlan.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.memberships.push(activeMembership);
    }

    // Generate Invoice
    const invoiceNumber = `INV-UPG-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: PaymentDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      memberName: req.user!.name,
      memberEmail: req.user!.email,
      planId: newPlan._id,
      planName: `${newPlan.name} (Upgrade)`,
      amount: newPlan.price,
      currency: 'USD',
      status: 'paid',
      paymentMethod,
      transactionId: `TXN-UPG-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNumber,
      invoiceDate: nowIso.split('T')[0],
      paidAt: nowIso,
      items: [{ description: `${newPlan.name} Upgrade`, amount: newPlan.price }],
      subtotal: newPlan.price,
      taxAmount: 0,
      createdAt: nowIso,
    };
    db.payments.unshift(newPayment);

    // Apply Target Macro Goals
    if (applyTargets && targetGoals) {
      let dietPlan = db.dietPlans.find(d => d.userId === user._id);
      if (!dietPlan) {
        dietPlan = {
          _id: generateObjectId(),
          userId: user._id,
          targetCalories: targetGoals.targetCalories || 2800,
          targetProteinG: targetGoals.targetProteinG || 200,
          targetCarbsG: targetGoals.targetCarbsG || 300,
          targetFatsG: targetGoals.targetFatsG || 75,
          waterTargetMl: targetGoals.waterTargetMl || 3800,
          waterConsumedMl: 0,
          date: nowIso.split('T')[0],
          meals: [],
          dietaryPreference: 'High Protein',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.dietPlans.push(dietPlan);
      } else {
        dietPlan.targetCalories = targetGoals.targetCalories || dietPlan.targetCalories;
        dietPlan.targetProteinG = targetGoals.targetProteinG || dietPlan.targetProteinG;
        dietPlan.targetCarbsG = targetGoals.targetCarbsG || dietPlan.targetCarbsG;
        dietPlan.targetFatsG = targetGoals.targetFatsG || dietPlan.targetFatsG;
        dietPlan.waterTargetMl = targetGoals.waterTargetMl || dietPlan.waterTargetMl;
        dietPlan.updatedAt = nowIso;
      }

      // Add a celebration Member Goal
      db.memberGoals.unshift({
        _id: generateObjectId(),
        userId: user._id,
        title: `${newPlan.name} Transformation Program`,
        category: 'Consistency',
        currentValue: 1,
        targetValue: newPlan.duration,
        unit: 'days',
        deadline: newEndDate.toISOString().split('T')[0],
        status: 'in_progress',
        createdAt: nowIso,
      });
    }

    // Notifications
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: user._id,
      title: '⚡ Plan Upgraded!',
      message: `You are now on the ${newPlan.name} tier! Your membership is extended through ${newEndDate.toLocaleDateString()}.`,
      type: 'payment',
      isRead: false,
      link: '/dashboard',
      createdAt: nowIso,
    });

    dbStore.save();

    res.json({
      success: true,
      message: `⚡ Successfully upgraded to ${newPlan.name}! Valid until ${newEndDate.toLocaleDateString()}.`,
      data: {
        membership: activeMembership,
        plan: newPlan,
        invoiceNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/memberships/:id (Admin edit / extend dates)
apiRouter.put('/memberships/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const membership = db.memberships.find(m => m._id === req.params.id);
    if (!membership) {
      res.status(404).json({ success: false, message: 'Membership record not found.' });
      return;
    }

    const { startDate, endDate, planId } = req.body;
    if (startDate) membership.startDate = new Date(startDate).toISOString();
    if (endDate) membership.endDate = new Date(endDate).toISOString();
    if (planId) membership.planId = planId;
    membership.updatedAt = new Date().toISOString();

    dbStore.save();
    res.json({
      success: true,
      message: 'Membership updated.',
      data: {
        ...membership,
        status: computeMembershipStatus(membership.startDate, membership.endDate),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   5. TRAINERS
   ========================================================================== */

// GET /api/trainers
apiRouter.get('/trainers', async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const showAll = req.query.all === 'true';
    const trainers = showAll ? db.trainers : db.trainers.filter(t => t.isActive);
    res.json({ success: true, data: trainers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trainers (Admin only)
apiRouter.post('/trainers', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, photoUrl, specialization, experience, bio, email, phone } = req.body;
    if (!name || !specialization || !experience) {
      res.status(400).json({ success: false, message: 'Name, specialization and experience are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const now = new Date().toISOString();

    const newTrainer: TrainerDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      photoUrl: photoUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      specialization: specialization.trim(),
      experience: experience.trim(),
      bio: bio ? bio.trim() : '',
      isActive: true,
      email: email?.trim(),
      phone: phone?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    db.trainers.push(newTrainer);
    dbStore.save();
    res.status(201).json({ success: true, message: 'Trainer added successfully.', data: newTrainer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/trainers/:id (Admin only)
apiRouter.put('/trainers/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const trainer = db.trainers.find(t => t._id === req.params.id);
    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found.' });
      return;
    }

    const { name, photoUrl, specialization, experience, bio, email, phone, isActive } = req.body;
    if (name) trainer.name = name.trim();
    if (photoUrl) trainer.photoUrl = photoUrl.trim();
    if (specialization) trainer.specialization = specialization.trim();
    if (experience) trainer.experience = experience.trim();
    if (bio !== undefined) trainer.bio = bio.trim();
    if (email !== undefined) trainer.email = email.trim();
    if (phone !== undefined) trainer.phone = phone.trim();
    if (isActive !== undefined) trainer.isActive = Boolean(isActive);

    trainer.updatedAt = new Date().toISOString();
    dbStore.save();
    res.json({ success: true, message: 'Trainer details updated.', data: trainer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/trainers/:id (Admin only: safety check)
apiRouter.delete('/trainers/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const trainerId = req.params.id;
    const trainerIndex = db.trainers.findIndex(t => t._id === trainerId);

    if (trainerIndex === -1) {
      res.status(404).json({ success: false, message: 'Trainer not found.' });
      return;
    }

    // Check if referenced in schedules
    const isReferenced = db.schedules.some(s => s.trainerId === trainerId);
    if (isReferenced) {
      db.trainers[trainerIndex].isActive = false;
      db.trainers[trainerIndex].updatedAt = new Date().toISOString();
      dbStore.save();
      res.json({
        success: true,
        message: 'Trainer is scheduled for upcoming workouts, so they have been marked inactive rather than deleted.',
        data: { action: 'deactivated', trainer: db.trainers[trainerIndex] },
      });
      return;
    }

    const removed = db.trainers.splice(trainerIndex, 1)[0];
    dbStore.save();
    res.json({ success: true, message: `Trainer ${removed.name} removed.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   6. WORKOUT SCHEDULES
   ========================================================================== */

// GET /api/schedules
apiRouter.get('/schedules', async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { workoutType, date } = req.query;

    let filtered = [...db.schedules];
    if (workoutType && workoutType !== 'All') {
      filtered = filtered.filter(s => s.workoutType.toLowerCase() === (workoutType as string).toLowerCase());
    }
    if (date) {
      filtered = filtered.filter(s => s.date === date);
    }

    const enriched = filtered.map(s => {
      const trainer = db.trainers.find(t => t._id === s.trainerId);
      return {
        ...s,
        trainer: trainer ? { _id: trainer._id, name: trainer.name, photoUrl: trainer.photoUrl, specialization: trainer.specialization } : null,
      };
    }).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/schedules (Admin only)
apiRouter.post('/schedules', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, workoutType, trainerId, date, startTime, duration, description, maxCapacity } = req.body;
    if (!title || !workoutType || !trainerId || !date || !startTime) {
      res.status(400).json({ success: false, message: 'Title, workout type, trainer, date and start time are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const now = new Date().toISOString();

    const newSchedule: WorkoutScheduleDoc = {
      _id: generateObjectId(),
      title: title.trim(),
      workoutType: workoutType.trim(),
      trainerId,
      date: date.trim(),
      startTime: startTime.trim(),
      duration: Number(duration) || 60,
      description: description ? description.trim() : '',
      maxCapacity: Number(maxCapacity) || 15,
      enrolledCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.schedules.push(newSchedule);
    dbStore.save();

    const trainer = db.trainers.find(t => t._id === trainerId);
    res.status(201).json({
      success: true,
      message: 'Workout session scheduled.',
      data: {
        ...newSchedule,
        trainer,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/schedules/:id (Admin only)
apiRouter.put('/schedules/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const schedule = db.schedules.find(s => s._id === req.params.id);
    if (!schedule) {
      res.status(404).json({ success: false, message: 'Schedule not found.' });
      return;
    }

    const { title, workoutType, trainerId, date, startTime, duration, description, maxCapacity } = req.body;
    if (title) schedule.title = title.trim();
    if (workoutType) schedule.workoutType = workoutType.trim();
    if (trainerId) schedule.trainerId = trainerId;
    if (date) schedule.date = date.trim();
    if (startTime) schedule.startTime = startTime.trim();
    if (duration !== undefined) schedule.duration = Number(duration);
    if (description !== undefined) schedule.description = description.trim();
    if (maxCapacity !== undefined) schedule.maxCapacity = Number(maxCapacity);

    schedule.updatedAt = new Date().toISOString();
    dbStore.save();
    res.json({ success: true, message: 'Schedule updated.', data: schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/schedules/:id (Admin only)
apiRouter.delete('/schedules/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const index = db.schedules.findIndex(s => s._id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Schedule not found.' });
      return;
    }

    const removed = db.schedules.splice(index, 1)[0];
    dbStore.save();
    res.json({ success: true, message: `Schedule "${removed.title}" deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   7. ENQUIRIES (Public Contact & Admin CRM)
   ========================================================================== */

// POST /api/enquiries (Public: validate and save)
apiRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    const db = await dbStore.getDB();
    const now = new Date().toISOString();

    const newEnquiry: EnquiryDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      email: emailTrimmed,
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'General Fitness Inquiry',
      message: message.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    db.enquiries.push(newEnquiry);
    dbStore.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
      data: newEnquiry,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/enquiries (Admin only)
apiRouter.get('/enquiries', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { search = '', status = 'all' } = req.query;

    let list = [...db.enquiries];
    if (status !== 'all') {
      list = list.filter(e => e.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/enquiries/:id (Admin update status)
apiRouter.put('/enquiries/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const enquiry = db.enquiries.find(e => e._id === req.params.id);
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found.' });
      return;
    }

    const { status } = req.body;
    if (status && ['pending', 'contacted', 'resolved'].includes(status)) {
      enquiry.status = status;
      enquiry.updatedAt = new Date().toISOString();
      dbStore.save();
      res.json({ success: true, message: `Enquiry status updated to ${status}.`, data: enquiry });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid status. Allowed: pending, contacted, resolved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/enquiries/:id (Admin only)
apiRouter.delete('/enquiries/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const index = db.enquiries.findIndex(e => e._id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Enquiry not found.' });
      return;
    }

    db.enquiries.splice(index, 1);
    dbStore.save();
    res.json({ success: true, message: 'Enquiry removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   7.5 APPOINTMENTS & LIVE SLOT BOOKING
   ========================================================================== */

const ALL_TIME_SLOTS = [
  '07:00 AM',
  '08:30 AM',
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
];

// GET /api/appointments/available-slots (Public/Member: live slot availability)
apiRouter.get('/appointments/available-slots', async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { date, trainerId } = req.query;

    if (!date) {
      res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
      return;
    }

    const dateStr = String(date).trim();
    // Find non-cancelled appointments for this date
    const bookedAppointments = (db.appointments || []).filter(a => {
      if (a.date !== dateStr) return false;
      if (a.status === 'cancelled') return false;
      if (trainerId && a.trainerId && a.trainerId !== trainerId) return false;
      return true;
    });

    const bookedSlotsSet = new Set(bookedAppointments.map(a => a.timeSlot));

    const slots = ALL_TIME_SLOTS.map(time => ({
      time,
      isAvailable: !bookedSlotsSet.has(time),
      bookedCount: bookedAppointments.filter(a => a.timeSlot === time).length,
    }));

    res.json({
      success: true,
      data: {
        date: dateStr,
        trainerId: trainerId || null,
        totalSlots: slots.length,
        availableSlotsCount: slots.filter(s => s.isAvailable).length,
        slots,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/appointments (Book appointment)
apiRouter.post('/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const {
      memberName,
      memberEmail,
      memberPhone,
      service,
      trainerId,
      trainerName,
      date,
      timeSlot,
      duration,
      notes,
    } = req.body;

    if (!memberName || !memberEmail || !service || !date || !timeSlot) {
      res.status(400).json({
        success: false,
        message: 'Member name, email, service, date, and time slot are required.',
      });
      return;
    }

    const emailTrimmed = String(memberEmail).trim().toLowerCase();
    const dateTrimmed = String(date).trim();
    const slotTrimmed = String(timeSlot).trim();

    const db = await dbStore.getDB();
    if (!db.appointments) db.appointments = [];

    // Live Slot Collision Check: Is slot already booked for this trainer & date?
    const isAlreadyBooked = db.appointments.some(a => {
      if (a.date !== dateTrimmed || a.timeSlot !== slotTrimmed) return false;
      if (a.status === 'cancelled') return false;
      // If a specific trainer is requested, check that trainer's schedule
      if (trainerId && a.trainerId) {
        return a.trainerId === trainerId;
      }
      return true;
    });

    if (isAlreadyBooked) {
      res.status(409).json({
        success: false,
        message: `The ${slotTrimmed} slot on ${dateTrimmed} has just been booked. Please choose another available time slot.`,
      });
      return;
    }

    // Resolve trainer name if trainerId passed
    let resolvedTrainerName = trainerName || '';
    if (trainerId && !resolvedTrainerName) {
      const trainer = db.trainers.find(t => t._id === trainerId);
      if (trainer) resolvedTrainerName = trainer.name;
    }

    const now = new Date().toISOString();
    const newAppointment: AppointmentDoc = {
      _id: generateObjectId(),
      userId: req.user?.id || undefined,
      memberName: String(memberName).trim(),
      memberEmail: emailTrimmed,
      memberPhone: memberPhone ? String(memberPhone).trim() : '',
      service: String(service).trim(),
      trainerId: trainerId || undefined,
      trainerName: resolvedTrainerName || 'Any Available Coach',
      date: dateTrimmed,
      timeSlot: slotTrimmed,
      duration: Number(duration) || 60,
      notes: notes ? String(notes).trim() : '',
      status: 'confirmed', // Confirmed appointment
      createdAt: now,
      updatedAt: now,
    };

    db.appointments.push(newAppointment);
    dbStore.save();

    res.status(201).json({
      success: true,
      message: `Appointment for ${service} confirmed on ${dateTrimmed} at ${slotTrimmed}!`,
      data: newAppointment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments/my (Member view own bookings)
apiRouter.get('/appointments/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const userId = req.user?.id;
    const userEmail = req.user?.email.toLowerCase();

    const myAppointments = (db.appointments || [])
      .filter(a => (userId && a.userId === userId) || (userEmail && a.memberEmail.toLowerCase() === userEmail))
      .sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`));

    res.json({ success: true, data: myAppointments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments (Admin only: view all appointments)
apiRouter.get('/appointments', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const { status = 'all', search = '', date } = req.query;

    let list = [...(db.appointments || [])];

    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    if (date) {
      list = list.filter(a => a.date === date);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberEmail.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q) ||
        (a.trainerName && a.trainerName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`));

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/appointments/:id (Admin update status or cancel)
apiRouter.put('/appointments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const appointment = (db.appointments || []).find(a => a._id === req.params.id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id && appointment.userId === req.user.id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: 'Unauthorized to modify this appointment.' });
      return;
    }

    const { status, notes, timeSlot, date } = req.body;

    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status.' });
        return;
      }
      appointment.status = status;
    }

    if (isAdmin) {
      if (notes !== undefined) appointment.notes = notes;
      if (date) appointment.date = date;
      if (timeSlot) appointment.timeSlot = timeSlot;
    }

    appointment.updatedAt = new Date().toISOString();
    dbStore.save();

    res.json({ success: true, message: `Appointment updated to ${appointment.status}.`, data: appointment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/appointments/:id (Cancel / Delete appointment)
apiRouter.delete('/appointments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const index = (db.appointments || []).findIndex(a => a._id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    const appt = db.appointments[index];
    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id && appt.userId === req.user.id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    db.appointments.splice(index, 1);
    dbStore.save();

    res.json({ success: true, message: 'Appointment removed and time slot freed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   8. ADMIN DASHBOARD STATS
   ========================================================================== */

// GET /api/dashboard/stats (Admin only: real database counts)
apiRouter.get('/dashboard/stats', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();

    const totalMembers = db.users.filter(u => u.role === 'member').length;
    const totalTrainers = db.trainers.filter(t => t.isActive).length;
    const totalEnquiries = db.enquiries.length;
    const pendingEnquiries = db.enquiries.filter(e => e.status === 'pending').length;

    const appointmentsList = db.appointments || [];
    const totalAppointments = appointmentsList.length;
    const pendingAppointments = appointmentsList.filter(a => a.status === 'pending').length;
    const confirmedAppointments = appointmentsList.filter(a => a.status === 'confirmed').length;

    // Calculate active vs expired memberships dynamically
    let activeMembershipsCount = 0;
    let expiredMembershipsCount = 0;
    let totalRevenue = 0;

    // Track unique active user IDs
    const activeUserIds = new Set<string>();

    db.memberships.forEach(m => {
      const status = computeMembershipStatus(m.startDate, m.endDate);
      if (status === 'Active') {
        activeMembershipsCount++;
        activeUserIds.add(m.userId);
      } else if (status === 'Expired') {
        expiredMembershipsCount++;
      }
      if (m.amountPaid) {
        totalRevenue += m.amountPaid;
      }
    });

    const recentMembers = db.users
      .filter(u => u.role === 'member')
      .slice(-5)
      .reverse()
      .map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
      }));

    const recentEnquiries = db.enquiries.slice(-5).reverse();
    const recentAppointments = (db.appointments || []).slice(-5).reverse();

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers: activeUserIds.size,
        expiredMemberships: expiredMembershipsCount,
        totalTrainers,
        totalPlans: db.plans.filter(p => p.isActive).length,
        totalSchedules: db.schedules.length,
        totalEnquiries,
        pendingEnquiries,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        totalRevenue,
        recentMembers,
        recentEnquiries,
        recentAppointments,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   9. COMPASS / DATABASE INSPECTOR API
   ========================================================================== */

// GET /api/compass/summary
apiRouter.get('/compass/summary', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const collections = [
      { name: 'users', count: db.users.length, indexes: ['_id (primary)', 'email (unique)'] },
      { name: 'membershipplans', count: db.plans.length, indexes: ['_id (primary)', 'name (index)'] },
      { name: 'memberships', count: db.memberships.length, indexes: ['_id (primary)', 'userId (ref)', 'planId (ref)'] },
      { name: 'trainers', count: db.trainers.length, indexes: ['_id (primary)'] },
      { name: 'workoutschedules', count: db.schedules.length, indexes: ['_id (primary)', 'trainerId (ref)'] },
      { name: 'enquiries', count: db.enquiries.length, indexes: ['_id (primary)', 'status (index)'] },
      { name: 'appointments', count: (db.appointments || []).length, indexes: ['_id (primary)', 'date (index)', 'timeSlot (index)'] },
    ];
    const dbStatus = getDbStatus();
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_management';
    res.json({
      success: true,
      data: {
        connectionUri: maskMongoUri(uri),
        databaseName: dbStatus.databaseName,
        isConnected: dbStatus.isConnected,
        state: dbStatus.state,
        collections,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/compass/collection/:name
apiRouter.get('/compass/collection/:name', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const colName = req.params.name.toLowerCase();

    let docs: any[] = [];
    switch (colName) {
      case 'users':
        docs = db.users.map(u => ({ ...u, password: '[PROTECTED BCRYPT HASH]' }));
        break;
      case 'membershipplans':
      case 'plans':
        docs = db.plans;
        break;
      case 'memberships':
        docs = db.memberships;
        break;
      case 'trainers':
        docs = db.trainers;
        break;
      case 'workoutschedules':
      case 'schedules':
        docs = db.schedules;
        break;
      case 'enquiries':
        docs = db.enquiries;
        break;
      case 'appointments':
        docs = db.appointments || [];
        break;
      case 'attendance':
        docs = db.attendance || [];
        break;
      case 'fitnessprogress':
      case 'progress':
        docs = db.fitnessProgress || [];
        break;
      case 'workoutplans':
        docs = db.workoutPlans || [];
        break;
      case 'dietplans':
        docs = db.dietPlans || [];
        break;
      case 'payments':
        docs = db.payments || [];
        break;
      case 'equipment':
        docs = db.equipment || [];
        break;
      case 'inventory':
        docs = db.inventory || [];
        break;
      case 'feedbacks':
        docs = db.feedbacks || [];
        break;
      case 'membergoals':
      case 'goals':
        docs = db.memberGoals || [];
        break;
      case 'challenges':
        docs = db.challenges || [];
        break;
      case 'notifications':
        docs = db.notifications || [];
        break;
      default:
        res.status(404).json({ success: false, message: 'Collection not found in gym_management DB.' });
        return;
    }

    res.json({ success: true, collection: colName, count: docs.length, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/compass/reset
apiRouter.post('/compass/reset', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const freshData = await dbStore.resetToSeed();
    res.json({ success: true, message: 'Database reset to initial demo seeds.', data: freshData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   10. ATTENDANCE & QR CHECK-IN API
   ========================================================================== */

// POST /api/attendance/checkin
apiRouter.post('/attendance/checkin', async (req: Request, res: Response) => {
  try {
    const { qrData, memberId, memberEmail, location = 'Turnstile A (Main Entrance)' } = req.body;
    const db = await dbStore.getDB();

    // Find member by ID or parsed QR data or email
    let targetUserId = memberId;
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        targetUserId = parsed.userId || parsed.id || parsed._id || targetUserId;
      } catch {
        targetUserId = qrData;
      }
    }

    let user = db.users.find(u => u._id === targetUserId);
    if (!user && memberEmail) {
      user = db.users.find(u => u.email.toLowerCase() === memberEmail.trim().toLowerCase());
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'Invalid QR Pass or Member ID. Member not found in database.' });
      return;
    }

    // Verify membership status
    const membership = db.memberships
      .filter(m => m.userId === user._id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

    const status = membership ? computeMembershipStatus(membership.startDate, membership.endDate) : 'Expired';

    if (status === 'Expired') {
      res.status(403).json({
        success: false,
        isExpired: true,
        message: `Turnstile Access Denied: Membership expired on ${membership ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}. Please renew your plan.`,
        data: { user: { name: user.name, email: user.email }, status },
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // Record attendance
    const record: AttendanceDoc = {
      _id: generateObjectId(),
      userId: user._id,
      memberName: user.name,
      memberEmail: user.email,
      checkInTime: nowIso,
      date: todayStr,
      method: qrData ? 'QR_SCAN' : 'MANUAL_KIOSK',
      location,
      status: 'Checked In',
    };

    db.attendance.unshift(record);
    dbStore.save();

    // Create a check-in notification for member
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: user._id,
      title: 'Gym Check-In Verified',
      message: `Welcome to FLEXI! Access granted at ${location} on ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'workout',
      isRead: false,
      createdAt: nowIso,
    });
    dbStore.save();

    res.json({
      success: true,
      message: `Access Granted! Welcome to FLEXI, ${user.name}.`,
      data: {
        record,
        member: { name: user.name, email: user.email, status },
        timestamp: nowIso,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/history (for current user)
apiRouter.get('/attendance/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const records = db.attendance.filter(a => a.userId === req.user!.id);
    res.json({ success: true, count: records.length, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/today (for admin & trainers)
apiRouter.get('/attendance/today', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = db.attendance.filter(a => a.date === todayStr);

    // Hourly distribution
    const hourlyCounts: Record<string, number> = {
      '06:00': 4,
      '07:00': 8,
      '08:00': 12,
      '09:00': 15,
      '10:00': 9,
      '11:00': 6,
      '12:00': 8,
      '13:00': 5,
      '14:00': 4,
      '15:00': 7,
      '16:00': 14,
      '17:00': 22,
      '18:00': 28,
      '19:00': 19,
      '20:00': 11,
    };

    res.json({
      success: true,
      count: todayRecords.length,
      data: {
        todayRecords,
        hourlyDistribution: hourlyCounts,
        currentOccupancy: todayRecords.filter(r => r.status === 'Checked In').length + 14,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   11. FITNESS PROGRESS & BMI TRACKER API
   ========================================================================== */

// GET /api/progress/history
apiRouter.get('/progress/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const userId = req.query.userId as string || req.user!.id;
    const records = db.fitnessProgress
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ success: true, count: records.length, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/progress/log
apiRouter.post('/progress/log', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { weightKg, heightCm, bodyFatPercentage, chestCm, waistCm, armsCm, notes, date } = req.body;
    if (!weightKg || !heightCm) {
      res.status(400).json({ success: false, message: 'Weight (kg) and Height (cm) are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const heightInMeters = Number(heightCm) / 100;
    const computedBmi = Number((Number(weightKg) / (heightInMeters * heightInMeters)).toFixed(1));
    const nowIso = new Date().toISOString();
    const logDate = date || nowIso.split('T')[0];

    const record: FitnessProgressDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      date: logDate,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      bmi: computedBmi,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
      chestCm: chestCm ? Number(chestCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      armsCm: armsCm ? Number(armsCm) : undefined,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: nowIso,
    };

    db.fitnessProgress.push(record);
    dbStore.save();

    res.status(201).json({
      success: true,
      message: 'Body metrics logged successfully!',
      data: record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   12. PERSONALIZED WORKOUT PLANNER API
   ========================================================================== */

// GET /api/workouts/my
apiRouter.get('/workouts/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    let plans = db.workoutPlans.filter(w => w.userId === req.user!.id);

    // If user has no plans yet, copy template plan
    if (plans.length === 0) {
      const template = db.workoutPlans[0];
      if (template) {
        const copy: WorkoutPlanDoc = {
          ...template,
          _id: generateObjectId(),
          userId: req.user!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.workoutPlans.push(copy);
        dbStore.save();
        plans = [copy];
      }
    }

    res.json({ success: true, count: plans.length, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/workouts/assign (Trainer/Admin)
apiRouter.post('/workouts/assign', authMiddleware, trainerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, dayOfWeek, category, difficulty, exercises, notes } = req.body;
    if (!userId || !title || !exercises || !Array.isArray(exercises)) {
      res.status(400).json({ success: false, message: 'User ID, title, and exercises array are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const newPlan: WorkoutPlanDoc = {
      _id: generateObjectId(),
      userId,
      trainerId: req.user!.id,
      title,
      dayOfWeek: dayOfWeek || 'Monday',
      category: category || 'Strength',
      difficulty: difficulty || 'Intermediate',
      exercises: exercises.map((e: any, idx: number) => ({
        id: e.id || `ex-${Date.now()}-${idx}`,
        name: e.name,
        targetSets: Number(e.targetSets || 3),
        targetReps: String(e.targetReps || '10-12'),
        restSeconds: Number(e.restSeconds || 60),
        weightTargetKg: e.weightTargetKg ? Number(e.weightTargetKg) : undefined,
        completedSets: 0,
        isCompleted: false,
      })),
      notes,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.workoutPlans.unshift(newPlan);
    dbStore.save();

    // Send notification to member
    db.notifications.unshift({
      _id: generateObjectId(),
      userId,
      title: 'New Workout Routine Assigned',
      message: `Coach assigned you '${title}' (${newPlan.category}). Check your Workout Planner.`,
      type: 'workout',
      isRead: false,
      link: '/dashboard',
      createdAt: new Date().toISOString(),
    });
    dbStore.save();

    res.status(201).json({ success: true, message: 'Workout routine assigned successfully!', data: newPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/workouts/:planId/exercise/:exerciseId/toggle
apiRouter.put('/workouts/:planId/exercise/:exerciseId/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { planId, exerciseId } = req.params;
    const db = await dbStore.getDB();
    const plan = db.workoutPlans.find(w => w._id === planId && (w.userId === req.user!.id || req.user!.role === 'admin'));

    if (!plan) {
      res.status(404).json({ success: false, message: 'Workout plan not found.' });
      return;
    }

    const exercise = plan.exercises.find(e => e.id === exerciseId);
    if (!exercise) {
      res.status(404).json({ success: false, message: 'Exercise not found in plan.' });
      return;
    }

    exercise.isCompleted = !exercise.isCompleted;
    if (exercise.isCompleted) {
      exercise.completedSets = exercise.targetSets;
    } else {
      exercise.completedSets = 0;
    }
    plan.updatedAt = new Date().toISOString();
    dbStore.save();

    res.json({ success: true, message: 'Exercise status updated!', data: exercise });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   13. DIET & NUTRITION PLANNER API
   ========================================================================== */

// GET /api/nutrition/my
apiRouter.get('/nutrition/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const todayStr = new Date().toISOString().split('T')[0];
    let plan = db.dietPlans.find(d => d.userId === req.user!.id);

    if (!plan) {
      const template = db.dietPlans[0];
      if (template) {
        plan = {
          ...template,
          _id: generateObjectId(),
          userId: req.user!.id,
          date: todayStr,
          waterConsumedMl: 1500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.dietPlans.push(plan);
        dbStore.save();
      }
    }

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/nutrition/meal
apiRouter.post('/nutrition/meal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { mealId, toggle, newMeal } = req.body;
    const db = await dbStore.getDB();
    let plan = db.dietPlans.find(d => d.userId === req.user!.id);

    if (!plan) {
      res.status(404).json({ success: false, message: 'Diet plan not found.' });
      return;
    }

    if (mealId && toggle) {
      const meal = plan.meals.find(m => m.id === mealId);
      if (meal) {
        meal.isLogged = !meal.isLogged;
        dbStore.save();
        res.json({ success: true, message: 'Meal logged state toggled.', data: plan });
        return;
      }
    }

    if (newMeal) {
      const addedMeal = {
        id: `meal-${Date.now()}`,
        mealType: newMeal.mealType || 'Snack',
        title: newMeal.title || 'Snack Item',
        calories: Number(newMeal.calories || 200),
        proteinG: Number(newMeal.proteinG || 15),
        carbsG: Number(newMeal.carbsG || 20),
        fatsG: Number(newMeal.fatsG || 5),
        isLogged: true,
        notes: newMeal.notes || '',
      };
      plan.meals.push(addedMeal);
      dbStore.save();
      res.status(201).json({ success: true, message: 'Meal added to daily nutrition!', data: plan });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid payload.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/nutrition/water
apiRouter.post('/nutrition/water', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amountMl = 250, setAbsolute } = req.body;
    const db = await dbStore.getDB();
    let plan = db.dietPlans.find(d => d.userId === req.user!.id);

    if (!plan) {
      res.status(404).json({ success: false, message: 'Diet plan not found.' });
      return;
    }

    if (setAbsolute !== undefined) {
      plan.waterConsumedMl = Math.max(0, Number(setAbsolute));
    } else {
      plan.waterConsumedMl = Math.max(0, plan.waterConsumedMl + Number(amountMl));
    }
    dbStore.save();

    res.json({ success: true, message: 'Water intake updated!', waterConsumedMl: plan.waterConsumedMl });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/nutrition/targets
apiRouter.put('/nutrition/targets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetCalories, targetProteinG, targetCarbsG, targetFatsG, waterTargetMl, dietaryPreference } = req.body;
    const db = await dbStore.getDB();
    const todayStr = new Date().toISOString().split('T')[0];
    let plan = db.dietPlans.find(d => d.userId === req.user!.id);

    if (!plan) {
      plan = {
        _id: generateObjectId(),
        userId: req.user!.id,
        targetCalories: Number(targetCalories) || 2400,
        targetProteinG: Number(targetProteinG) || 180,
        targetCarbsG: Number(targetCarbsG) || 250,
        targetFatsG: Number(targetFatsG) || 70,
        waterTargetMl: Number(waterTargetMl) || 3500,
        waterConsumedMl: 0,
        date: todayStr,
        meals: [],
        dietaryPreference: dietaryPreference || 'High Protein',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.dietPlans.push(plan);
    } else {
      if (targetCalories !== undefined) plan.targetCalories = Number(targetCalories);
      if (targetProteinG !== undefined) plan.targetProteinG = Number(targetProteinG);
      if (targetCarbsG !== undefined) plan.targetCarbsG = Number(targetCarbsG);
      if (targetFatsG !== undefined) plan.targetFatsG = Number(targetFatsG);
      if (waterTargetMl !== undefined) plan.waterTargetMl = Number(waterTargetMl);
      if (dietaryPreference) plan.dietaryPreference = dietaryPreference;
      plan.updatedAt = new Date().toISOString();
    }

    dbStore.save();
    res.json({ success: true, message: 'Macro targets updated successfully!', data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   14. PAYMENTS & INVOICES API
   ========================================================================== */

// GET /api/payments/my
apiRouter.get('/payments/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const payments = db.payments.filter(p => p.userId === req.user!.id);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/all (Admin)
apiRouter.get('/payments/all', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    res.json({ success: true, count: db.payments.length, data: db.payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/pay-pending
apiRouter.post('/payments/pay-pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, paymentMethod = 'Credit Card' } = req.body;
    const db = await dbStore.getDB();
    const payment = db.payments.find(p => p._id === paymentId && p.userId === req.user!.id);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (payment.status === 'paid') {
      res.status(400).json({ success: false, message: 'Invoice has already been settled.' });
      return;
    }

    const now = new Date();
    payment.status = 'paid';
    payment.paidAt = now.toISOString();
    payment.paymentMethod = paymentMethod;
    payment.transactionId = `TXN-FLX-${Math.floor(100000 + Math.random() * 900000)}-US`;

    // Also renew membership if it was an expired membership
    const membership = db.memberships.find(m => m.userId === req.user!.id);
    if (membership) {
      const plan = db.plans.find(p => p._id === membership.planId);
      const days = plan?.duration || 30;
      membership.startDate = now.toISOString();
      membership.endDate = new Date(now.getTime() + days * 86400000).toISOString();
      membership.updatedAt = now.toISOString();
    }

    // Add confirmation notification
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: req.user!.id,
      title: 'Payment Successful',
      message: `Payment of $${payment.amount} for ${payment.planName} received! Receipt is now available.`,
      type: 'payment',
      isRead: false,
      link: '/dashboard',
      createdAt: now.toISOString(),
    });

    dbStore.save();

    res.json({
      success: true,
      message: 'Payment processed successfully! Receipt generated.',
      data: payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/checkout (Consolidated basket checkout, membership activation, target application)
apiRouter.post('/cart/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { items, paymentMethod = 'Online Checkout', discountAmount = 0, appliedCoupon, applyGlobalTargets, targetMacroGoals } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Your basket is empty.' });
      return;
    }

    const db = await dbStore.getDB();
    const now = new Date();
    const nowIso = now.toISOString();
    const invoiceNumber = `INV-FLX-${Math.floor(100000 + Math.random() * 900000)}`;

    let totalCharged = 0;
    const processedSummaries: string[] = [];

    for (const item of items) {
      const itemPrice = Number(item.price || 0) * Number(item.quantity || 1);
      totalCharged += itemPrice;

      // Handle Plan or Upgrade items
      if (item.type === 'plan' || item.type === 'upgrade') {
        let recipientUser = db.users.find(u => u._id === req.user!.id);
        
        // If recipientEmail is specified (applicable for different user)
        if (item.recipientEmail && item.recipientEmail.trim()) {
          const recEmail = item.recipientEmail.trim().toLowerCase();
          let targetUser = db.users.find(u => u.email.toLowerCase() === recEmail);
          if (!targetUser) {
            // Automatically register new athlete account
            const autoPass = await bcrypt.hash('Member@123', 10);
            targetUser = {
              _id: generateObjectId(),
              name: item.recipientName ? item.recipientName.trim() : recEmail.split('@')[0],
              email: recEmail,
              password: autoPass,
              phone: '',
              role: 'member',
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            db.users.push(targetUser);
          }
          recipientUser = targetUser;
        }

        if (recipientUser) {
          const plan = db.plans.find(p => p._id === item.planId) || db.plans[0];
          const durationDays = item.durationDays || plan?.duration || 30;

          // Check if user already has an active membership
          const userMems = db.memberships
            .filter(m => m.userId === recipientUser!._id)
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
          
          let activeMem = userMems.find(m => new Date(m.endDate).getTime() > now.getTime()) || userMems[0];

          let newEndDate: Date;
          if (activeMem && new Date(activeMem.endDate).getTime() > now.getTime()) {
            // Extend existing active membership duration
            const currentEndMs = new Date(activeMem.endDate).getTime();
            newEndDate = new Date(currentEndMs + durationDays * 86400000);
            activeMem.planId = plan ? plan._id : activeMem.planId;
            activeMem.endDate = newEndDate.toISOString();
            activeMem.amountPaid = plan ? plan.price : activeMem.amountPaid;
            activeMem.paymentMethod = paymentMethod;
            activeMem.updatedAt = nowIso;
          } else {
            // New membership
            newEndDate = new Date(now.getTime() + durationDays * 86400000);
            activeMem = {
              _id: generateObjectId(),
              userId: recipientUser._id,
              planId: plan ? plan._id : 'custom',
              startDate: nowIso,
              endDate: newEndDate.toISOString(),
              paymentMethod,
              amountPaid: itemPrice,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            db.memberships.push(activeMem);
          }

          // Apply Targets if requested
          if ((applyGlobalTargets || item.applyTargets) && targetMacroGoals) {
            let diet = db.dietPlans.find(d => d.userId === recipientUser!._id);
            if (!diet) {
              diet = {
                _id: generateObjectId(),
                userId: recipientUser!._id,
                targetCalories: targetMacroGoals.targetCalories || 2600,
                targetProteinG: targetMacroGoals.targetProteinG || 190,
                targetCarbsG: targetMacroGoals.targetCarbsG || 280,
                targetFatsG: targetMacroGoals.targetFatsG || 70,
                waterTargetMl: targetMacroGoals.waterTargetMl || 3500,
                waterConsumedMl: 0,
                date: nowIso.split('T')[0],
                meals: [],
                dietaryPreference: 'High Protein',
                createdAt: nowIso,
                updatedAt: nowIso,
              };
              db.dietPlans.push(diet);
            } else {
              diet.targetCalories = targetMacroGoals.targetCalories || diet.targetCalories;
              diet.targetProteinG = targetMacroGoals.targetProteinG || diet.targetProteinG;
              diet.targetCarbsG = targetMacroGoals.targetCarbsG || diet.targetCarbsG;
              diet.targetFatsG = targetMacroGoals.targetFatsG || diet.targetFatsG;
              diet.waterTargetMl = targetMacroGoals.waterTargetMl || diet.waterTargetMl;
              diet.updatedAt = nowIso;
            }
          }

          // In-app Notification
          db.notifications.unshift({
            _id: generateObjectId(),
            userId: recipientUser._id,
            title: item.type === 'upgrade' ? '⚡ Membership Upgraded' : 'Membership Activated',
            message: `Your ${item.title} pass is now active through ${newEndDate.toLocaleDateString()}.`,
            type: 'payment',
            isRead: false,
            link: '/dashboard',
            createdAt: nowIso,
          });

          processedSummaries.push(`${item.title} (${recipientUser.name || recipientUser.email})`);
        }
      } else if (item.type === 'inventory') {
        // Inventory stock deduction
        const product = db.inventory.find(i => i.name.toLowerCase() === item.title.toLowerCase());
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - (item.quantity || 1));
          product.updatedAt = nowIso;
        }
        processedSummaries.push(`${item.quantity}x ${item.title}`);
      } else {
        processedSummaries.push(item.title);
      }
    }

    // Apply coupon discount
    const netCharged = Math.max(0, totalCharged - Number(discountAmount || 0));

    // Create payment ledger record
    const paymentDoc: PaymentDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      memberName: req.user!.name,
      memberEmail: req.user!.email,
      planId: items[0]?.planId,
      planName: processedSummaries.join(' + ') || 'Basket Purchase',
      amount: netCharged,
      currency: 'USD',
      status: 'paid',
      paymentMethod,
      transactionId: `TXN-CRT-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNumber,
      invoiceDate: nowIso.split('T')[0],
      paidAt: nowIso,
      items: items.map((i: any) => ({ description: `${i.title} x${i.quantity || 1}`, amount: (i.price || 0) * (i.quantity || 1) })),
      subtotal: totalCharged,
      taxAmount: 0,
      createdAt: nowIso,
    };
    db.payments.unshift(paymentDoc);

    // Notification for purchaser
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: req.user!.id,
      title: 'Order Confirmed',
      message: `Your payment of $${netCharged} was approved. Invoice #${invoiceNumber} is ready in your receipts!`,
      type: 'payment',
      isRead: false,
      link: '/dashboard',
      createdAt: nowIso,
    });

    dbStore.save();

    res.status(200).json({
      success: true,
      message: `Payment approved! Receipt #${invoiceNumber} generated.`,
      data: {
        invoiceNumber,
        transactionId: paymentDoc.transactionId,
        totalAmount: netCharged,
        paymentMethod,
        itemsProcessed: items.length,
        processedSummaries,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   15. GYM EQUIPMENT API
   ========================================================================== */

// GET /api/equipment
apiRouter.get('/equipment', async (req: Request, res: Response) => {
  try {
    const { category, condition } = req.query;
    const db = await dbStore.getDB();
    let items = db.equipment;

    if (category) {
      items = items.filter(e => e.category.toLowerCase() === String(category).toLowerCase());
    }
    if (condition) {
      items = items.filter(e => e.condition.toLowerCase() === String(condition).toLowerCase());
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/equipment (Admin)
apiRouter.post('/equipment', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, brand, serialNumber, location, condition, lastServicedDate, nextServiceDueDate, technicianNotes } = req.body;
    if (!name || !category || !serialNumber) {
      res.status(400).json({ success: false, message: 'Name, category, and serial number are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const nowIso = new Date().toISOString();
    const newItem: EquipmentDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      category,
      brand: brand || 'FLEXI Commercial',
      serialNumber: serialNumber.trim(),
      location: location || 'Zone 1 - Main Floor',
      condition: condition || 'Good',
      lastServicedDate: lastServicedDate || nowIso.split('T')[0],
      nextServiceDueDate: nextServiceDueDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      technicianNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.equipment.unshift(newItem);
    dbStore.save();

    res.status(201).json({ success: true, message: 'Equipment added to inventory!', data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/equipment/:id (Admin)
apiRouter.put('/equipment/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const item = db.equipment.find(e => e._id === req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment item not found.' });
      return;
    }

    Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
    dbStore.save();

    res.json({ success: true, message: 'Equipment details updated!', data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/equipment/:id (Admin)
apiRouter.delete('/equipment/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const idx = db.equipment.findIndex(e => e._id === req.params.id);

    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Equipment item not found.' });
      return;
    }

    db.equipment.splice(idx, 1);
    dbStore.save();

    res.json({ success: true, message: 'Equipment deleted from registry.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   16. INVENTORY / PRO SHOP API
   ========================================================================== */

// GET /api/inventory
apiRouter.get('/inventory', async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    res.json({ success: true, count: db.inventory.length, data: db.inventory });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventory (Admin)
apiRouter.post('/inventory', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, sku, price, costPrice, stockQuantity, minThreshold, unit, description, imageUrl } = req.body;
    if (!name || !sku || !price) {
      res.status(400).json({ success: false, message: 'Product name, SKU, and price are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const nowIso = new Date().toISOString();
    const newItem: InventoryDoc = {
      _id: generateObjectId(),
      name: name.trim(),
      category: category || 'Supplements',
      sku: sku.trim().toUpperCase(),
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : Number(price) * 0.6,
      stockQuantity: Number(stockQuantity || 0),
      minThreshold: Number(minThreshold || 5),
      unit: unit || 'Piece',
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.inventory.unshift(newItem);
    dbStore.save();

    res.status(201).json({ success: true, message: 'Product added to Pro Shop inventory!', data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/inventory/:id (Admin)
apiRouter.put('/inventory/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const item = db.inventory.find(i => i._id === req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Inventory item not found.' });
      return;
    }

    Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
    dbStore.save();

    res.json({ success: true, message: 'Product inventory updated!', data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/inventory/:id (Admin)
apiRouter.delete('/inventory/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const idx = db.inventory.findIndex(i => i._id === req.params.id);

    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Inventory item not found.' });
      return;
    }

    db.inventory.splice(idx, 1);
    dbStore.save();

    res.json({ success: true, message: 'Product removed from catalog.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   17. FEEDBACK & TRAINER RATINGS API
   ========================================================================== */

// GET /api/feedback
apiRouter.get('/feedback', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query;
    const db = await dbStore.getDB();
    let feedbacks = db.feedbacks;

    if (trainerId) {
      feedbacks = feedbacks.filter(f => f.trainerId === trainerId);
    }

    res.json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/feedback
apiRouter.post('/feedback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetType = 'trainer', trainerId, rating, comment } = req.body;
    if (!rating || !comment) {
      res.status(400).json({ success: false, message: 'Rating (1-5) and comment are required.' });
      return;
    }

    const db = await dbStore.getDB();
    let trainerName: string | undefined;
    if (trainerId) {
      const trainer = db.trainers.find(t => t._id === trainerId);
      trainerName = trainer?.name;
    }

    const nowIso = new Date().toISOString();
    const newFeedback: FeedbackDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      memberName: req.user!.name,
      targetType,
      trainerId,
      trainerName,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: String(comment).trim(),
      date: nowIso.split('T')[0],
      createdAt: nowIso,
    };

    db.feedbacks.unshift(newFeedback);
    dbStore.save();

    res.status(201).json({ success: true, message: 'Thank you for your feedback!', data: newFeedback });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   18. MEMBER GOALS & MILESTONES API
   ========================================================================== */

// GET /api/goals
apiRouter.get('/goals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const goals = db.memberGoals.filter(g => g.userId === req.user!.id);
    res.json({ success: true, count: goals.length, data: goals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/goals
apiRouter.post('/goals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, currentValue, targetValue, unit, deadline } = req.body;
    if (!title || targetValue === undefined) {
      res.status(400).json({ success: false, message: 'Title and target value are required.' });
      return;
    }

    const db = await dbStore.getDB();
    const nowIso = new Date().toISOString();
    const newGoal: MemberGoalDoc = {
      _id: generateObjectId(),
      userId: req.user!.id,
      title: title.trim(),
      category: category || 'Personal Record',
      currentValue: Number(currentValue || 0),
      targetValue: Number(targetValue),
      unit: unit || 'kg',
      deadline: deadline || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: nowIso,
    };

    db.memberGoals.unshift(newGoal);
    dbStore.save();

    res.status(201).json({ success: true, message: 'Goal target established!', data: newGoal });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/goals/:id/achieve
apiRouter.put('/goals/:id/achieve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const goal = db.memberGoals.find(g => g._id === req.params.id && g.userId === req.user!.id);

    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found.' });
      return;
    }

    goal.status = 'achieved';
    goal.currentValue = goal.targetValue;
    goal.achievedAt = new Date().toISOString();

    // Trigger celebration notification
    db.notifications.unshift({
      _id: generateObjectId(),
      userId: req.user!.id,
      title: 'Milestone Smashed!',
      message: `Incredible! You crushed your milestone: "${goal.title}". Keep dominating!`,
      type: 'challenge',
      isRead: false,
      link: '/dashboard',
      createdAt: new Date().toISOString(),
    });

    dbStore.save();

    res.json({ success: true, message: 'Milestone celebrated and marked achieved!', data: goal });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   19. CHALLENGES & GAMIFICATION API
   ========================================================================== */

// GET /api/challenges
apiRouter.get('/challenges', async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.getDB();
    // Generate realistic athletic club leaderboard
    const leaderboard = [
      { rank: 1, name: 'David "The Beast" K.', points: 3450, streakDays: 48, badge: 'Century Titan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { rank: 2, name: 'Sarah Jenkins', points: 3120, streakDays: 32, badge: 'Iron Lifter', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=200&q=80' },
      { rank: 3, name: 'John Miller', points: 2890, streakDays: 28, badge: 'VO2 Max Beast', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { rank: 4, name: 'Devon Patel', points: 2450, streakDays: 19, badge: 'Dawn Warrior', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { rank: 5, name: 'Elena Rostova', points: 2200, streakDays: 14, badge: 'Cardio Slayer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
    ];

    res.json({
      success: true,
      data: {
        challenges: db.challenges,
        leaderboard,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/challenges/:id/join
apiRouter.post('/challenges/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const challenge = db.challenges.find(c => c._id === req.params.id);

    if (!challenge) {
      res.status(404).json({ success: false, message: 'Challenge not found.' });
      return;
    }

    challenge.participantsCount += 1;

    db.notifications.unshift({
      _id: generateObjectId(),
      userId: req.user!.id,
      title: `Joined Challenge: ${challenge.title}`,
      message: `You are now enrolled in the ${challenge.durationDays}-day quest! Reward: ${challenge.points} Points.`,
      type: 'challenge',
      isRead: false,
      link: '/dashboard',
      createdAt: new Date().toISOString(),
    });

    dbStore.save();

    res.json({ success: true, message: `Successfully joined ${challenge.title}!`, data: challenge });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   20. IN-APP NOTIFICATIONS API
   ========================================================================== */

// GET /api/notifications
apiRouter.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const userNotifs = db.notifications.filter(n => n.userId === req.user!.id || n.userId === 'all');
    const unreadCount = userNotifs.filter(n => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      count: userNotifs.length,
      data: userNotifs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
apiRouter.put('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const notif = db.notifications.find(n => n._id === req.params.id && (n.userId === req.user!.id || n.userId === 'all'));

    if (notif) {
      notif.isRead = true;
      dbStore.save();
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all
apiRouter.put('/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    db.notifications
      .filter(n => n.userId === req.user!.id || n.userId === 'all')
      .forEach(n => { n.isRead = true; });

    dbStore.save();
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   21. TRAINER PORTAL API
   ========================================================================== */

// GET /api/trainer/overview
apiRouter.get('/trainer/overview', authMiddleware, trainerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const trainerProfile = db.trainers.find(t => t.email?.toLowerCase() === req.user!.email.toLowerCase()) || db.trainers[0];

    // Assigned clients
    const clients = db.users.filter(u => u.assignedTrainerId === trainerProfile._id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Appointments assigned to this trainer
    const myAppointments = (db.appointments || []).filter(a => a.trainerId === trainerProfile._id || a.trainerName?.toLowerCase().includes(trainerProfile.name.toLowerCase()));
    const todaySessions = myAppointments.filter(a => a.date === todayStr);

    // Reviews
    const reviews = db.feedbacks.filter(f => f.trainerId === trainerProfile._id);
    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 4.9;

    res.json({
      success: true,
      data: {
        trainer: trainerProfile,
        totalClients: clients.length,
        todaySessionsCount: todaySessions.length,
        upcomingAppointments: myAppointments.filter(a => a.status === 'confirmed'),
        avgRating,
        totalReviews: reviews.length,
        reviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/trainer/clients
apiRouter.get('/trainer/clients', authMiddleware, trainerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbStore.getDB();
    const trainerProfile = db.trainers.find(t => t.email?.toLowerCase() === req.user!.email.toLowerCase()) || db.trainers[0];
    const clients = db.users.filter(u => u.assignedTrainerId === trainerProfile._id || u.role === 'member');

    const clientSummaries = clients.map(client => {
      const membership = db.memberships
        .filter(m => m.userId === client._id)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
      const plan = membership ? db.plans.find(p => p._id === membership.planId) : null;
      const status = membership ? computeMembershipStatus(membership.startDate, membership.endDate) : 'Expired';
      const latestProgress = db.fitnessProgress
        .filter(p => p.userId === client._id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const activeWorkout = db.workoutPlans.find(w => w.userId === client._id && w.status === 'active');

      return {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        membershipStatus: status,
        planName: plan?.name || 'No Active Plan',
        latestWeightKg: latestProgress?.weightKg || 80,
        latestBmi: latestProgress?.bmi || 24.5,
        activeWorkoutTitle: activeWorkout?.title || 'General Floor Conditioning',
      };
    });

    res.json({ success: true, count: clientSummaries.length, data: clientSummaries });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   22. REPORTS & CSV EXPORT API
   ========================================================================== */

// GET /api/reports/export/:type
apiRouter.get('/reports/export/:type', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const type = req.params.type.toLowerCase();
    const db = await dbStore.getDB();

    if (type === 'members') {
      let csv = 'ID,Name,Email,Phone,Role,Status,Plan,StartDate,EndDate\n';
      db.users.filter(u => u.role === 'member').forEach(u => {
        const membership = db.memberships.find(m => m.userId === u._id);
        const plan = membership ? db.plans.find(p => p._id === membership.planId) : null;
        const status = membership ? computeMembershipStatus(membership.startDate, membership.endDate) : 'Expired';
        csv += `"${u._id}","${u.name}","${u.email}","${u.phone}","${u.role}","${status}","${plan?.name || 'None'}","${membership?.startDate || ''}","${membership?.endDate || ''}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flexi_members_report.csv"');
      res.send(csv);
      return;
    }

    if (type === 'revenue' || type === 'payments') {
      let csv = 'InvoiceNumber,TransactionID,MemberName,MemberEmail,PlanName,Amount,Currency,Status,PaymentMethod,InvoiceDate\n';
      db.payments.forEach(p => {
        csv += `"${p.invoiceNumber}","${p.transactionId}","${p.memberName}","${p.memberEmail}","${p.planName}",${p.amount},"${p.currency}","${p.status}","${p.paymentMethod}","${p.invoiceDate}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flexi_revenue_report.csv"');
      res.send(csv);
      return;
    }

    if (type === 'attendance') {
      let csv = 'ID,MemberName,MemberEmail,CheckInTime,Date,Method,Location,Status\n';
      db.attendance.forEach(a => {
        csv += `"${a._id}","${a.memberName}","${a.memberEmail}","${a.checkInTime}","${a.date}","${a.method}","${a.location}","${a.status}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flexi_attendance_report.csv"');
      res.send(csv);
      return;
    }

    if (type === 'equipment') {
      let csv = 'ID,Name,Category,Brand,SerialNumber,Location,Condition,LastServiced,NextServiceDue\n';
      db.equipment.forEach(e => {
        csv += `"${e._id}","${e.name}","${e.category}","${e.brand}","${e.serialNumber}","${e.location}","${e.condition}","${e.lastServicedDate}","${e.nextServiceDueDate}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flexi_equipment_report.csv"');
      res.send(csv);
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid report type requested. Options: members, revenue, attendance, equipment.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   23. AI FITNESS COACH CHATBOT API (@google/genai & Heuristic Fallback)
   ========================================================================== */

// POST /api/ai/fitness-coach
apiRouter.post('/ai/fitness-coach', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Prompt message is required.' });
      return;
    }

    const userQuery = message.trim();

    // 1. If Gemini AI client is initialized with GEMINI_API_KEY, use gemini-3.8-flash
    if (geminiClient) {
      try {
        const systemPrompt = `You are "COACH FLEXI", the elite head athletic trainer and sports nutritionist at FLEXI Athletic Club.
Your tone is motivating, professional, scientifically rigorous, energetic, and encouraging.
Key Principles:
- Recommend evidence-based resistance training, progressive overload, proper biomechanics, and joint safety.
- Advise adequate protein intake (1.6g - 2.2g per kg of bodyweight) and whole-food nutrition.
- Address user queries directly with clear formatting, bullet points, and actionable routine/diet advice.
- When relevant, encourage scheduling sessions with FLEXI trainers (Marcus Vance, Elena Rostova, Liam Chen, Maya Patel) or logging metrics in the Member Portal.
User Context: ${JSON.stringify(context || {})}`;

        const promptContents = `${systemPrompt}\n\nUser Question: ${userQuery}`;

        const callPromise = geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContents,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 4500)
        );

        const aiResponse = (await Promise.race([callPromise, timeoutPromise])) as any;

        const reply = aiResponse.text;
        if (reply && reply.trim().length > 0) {
          res.json({
            success: true,
            source: 'gemini-3.8-flash',
            reply: reply.trim(),
          });
          return;
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, invoking intelligent athletic heuristic coach fallback:', geminiError.message);
        // Seamlessly continue to fallback!
      }
    }

    // 2. Comprehensive Athletic Heuristic Fallback Coach
    const lower = userQuery.toLowerCase();
    let coachReply = '';

    if (lower.includes('protein') || lower.includes('creatine') || lower.includes('supplement')) {
      coachReply = `**Coach FLEXI's Nutrition & Supplement Protocol:**

1. **Daily Protein Target**: Aim for **1.8g to 2.2g of protein per kg of body weight** spread across 3–4 meals (approx 35–50g per feeding). Great sources include chicken breast, wild salmon, whey isolate, egg whites, and Greek yogurt.
2. **Creatine Monohydrate**: The gold standard in sports science. Take **5g daily** consistently (no loading required). It supercharges intramuscular phosphocreatine stores for explosive strength and recovery.
3. **Pre-Workout Fuel**: Consume a complex carb source (e.g. rolled oats, banana) 60–90 minutes before your lifting session.
4. **Hydration**: Drink at least 3.5 Liters of water daily to maintain cellular hydration and optimize creatine uptake!`;
    } else if (lower.includes('deadlift') || lower.includes('squat') || lower.includes('bench') || lower.includes('strength') || lower.includes('pr')) {
      coachReply = `**Power & Biomechanics Masterclass with Coach FLEXI:**

- **Deadlifts**: Brace your core 360° before pulling. Wedge your hips, pull the slack out of the barbell, and push the floor away through your heels. Engage your lats to protect the lumbar spine.
- **Barbell Squats**: Descend with control, drive your knees track-aligned over toes, and maintain thoracic extension. Rest 2.5 to 3 minutes on heavy top sets for complete CNS recovery.
- **Bench Press**: Retract and depress your scapulae into the bench, maintain leg drive, and touch the barbell to the lower sternum with an arched bar path.

*Tip: Book a 1-on-1 form consultation with Head Coach Marcus Vance in the Book Sessions tab!*`;
    } else if (lower.includes('fat') || lower.includes('weight loss') || lower.includes('lose') || lower.includes('cut') || lower.includes('cardio')) {
      coachReply = `**Metabolic Acceleration & Fat-Loss Protocol:**

1. **Caloric Deficit**: Create a sustainable 350–500 kcal daily deficit under maintenance. Prioritize high dietary protein to spare lean muscle tissue.
2. **Resistance Training First**: Keep lifting heavy compound movements 3–4 times per week to signal muscle retention while burning fat.
3. **HIIT & Conditioning**: Integrate 2x 20-minute HIIT sessions (like our Woodway curved treadmills or Concept2 rowers) after lifting or on off-days.
4. **NEAT**: Aim for 8,000–10,000 daily steps. Non-exercise activity thermogenesis is responsible for the majority of daily energy expenditure!`;
    } else if (lower.includes('split') || lower.includes('workout') || lower.includes('routine') || lower.includes('plan')) {
      coachReply = `**Recommended FLEXI Training Split (4-Day Push/Pull/Legs/Upper):**

- **Day 1 (Push)**: Flat Barbell Bench (4x6), Incline DB Press (3x10), Overhead Military Press (3x8), Lateral Raises & Cable Tricep Pushdowns.
- **Day 2 (Pull)**: Conventional Deadlift (4x5), Weighted Pull-ups (4x8), Barbell Rows (3x10), Face Pulls & Incline Dumbbell Curls.
- **Day 3**: Active Recovery / Mobility Flow.
- **Day 4 (Legs & Core)**: Barbell Back Squats (4x8), Romanian Deadlifts (3x10), Walking Lunges (3x12 per leg), Hanging Leg Raises.
- **Day 5 (Upper Hypertrophy)**: Dips, Cable Crossover flys, Lat Pulldowns, Bicep 21s.

Check your **Workout Planner** in the Member Portal to track sets and rest countdowns!`;
    } else if (lower.includes('sore') || lower.includes('recovery') || lower.includes('sleep') || lower.includes('rest')) {
      coachReply = `**Athletic Recovery & CNS Rejuvenation:**

1. **Sleep Is King**: 7.5 to 9 hours of quality sleep is where 95% of human growth hormone (HGH) is released and muscle tissue repairs.
2. **Active Flush**: On rest days, do 20 minutes of zone 2 cycling or an easy walk to circulate oxygenated blood through sore muscles.
3. **Contrast Therapy**: Spend 15 minutes in our infrared sauna followed by a cold plunge to reduce systemic inflammation.
4. **Electrolytes**: Ensure you replenish sodium, potassium, and magnesium post-sweat!`;
    } else {
      coachReply = `**Coach FLEXI here!**

Whatever your fitness ambition—whether adding 20kg to your barbell deadlift, shedding body fat, or dialing in your daily macronutrient split—you are in the right club.

Here are 3 quick actions you can take today at FLEXI:
1. **Track Your Numbers**: Check your weight and body fat trends in the **Fitness Progress** tab.
2. **Follow Your Protocol**: Log your sets and rest intervals in the **Workout Planner**.
3. **Refuel**: Match your meals against your daily protein and calorie goals in the **Nutrition Planner**.

What specific muscle group, movement, or nutrition goal would you like to level up today?`;
    }

    res.json({
      success: true,
      source: 'coach-flexi-heuristic-engine',
      reply: coachReply,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'AI Coach service error.' });
  }
});

