import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import { apiRouter } from './apiRouter.ts';
import { connectDB, getDbStatus, verifyDatabaseWriteRead } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'flexi-jwt-secret-key-college-project-2026';

async function runAllTests() {
  console.log('====================================================');
  console.log('🏋️ FLEXI GYM MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  // Step 1: Connect DB
  console.log('👉 [TEST 1] MongoDB Connection Initialization...');
  const connected = await connectDB();
  const dbStatus = getDbStatus();
  console.log(`   MongoDB Status: ${dbStatus.state.toUpperCase()} (Connected: ${dbStatus.isConnected})`);
  console.log(`   Target: ${dbStatus.databaseName} at ${dbStatus.host}:${dbStatus.port}\n`);

  // Step 2: Database Write/Read verification
  console.log('👉 [TEST 2] MongoDB Write & Read Verification...');
  if (connected) {
    const wrResult = await verifyDatabaseWriteRead();
    console.log(`   Result: ${wrResult.success ? 'PASS ✅' : 'FAIL ❌'} - ${wrResult.message}\n`);
  } else {
    console.log('   Result: BLOCKED ⚠️ - MongoDB server is not running or unreachable at mongodb://127.0.0.1:27017/gym_management.');
    console.log('   (Compass inspection instructions provided in documentation)\n');
  }

  // Step 3: Boot test HTTP server on ephemeral port
  console.log('👉 [TEST 3] Express Backend Server Startup...');
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      backend: { status: 'online' },
      database: getDbStatus(),
    });
  });

  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  console.log(`   Backend Server Online at ${baseUrl} ✅\n`);

  let passedTests = 0;
  let totalTests = 0;

  async function request(path: string, options: any = {}) {
    const { headers = {}, ...rest } = options;
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      },
      ...rest,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, headers: res.headers, data };
  }

  function assert(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`   ✅ PASS: ${name}`);
    } else {
      console.error(`   ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
    }
  }

  // --- HEALTH CHECK ---
  console.log('👉 [TEST 4] Health Check Endpoint Test...');
  const healthRes = await request('/health');
  assert('GET /api/health returns 200 OK', healthRes.status === 200);
  assert('GET /api/health reports backend online', healthRes.data?.backend?.status === 'online');
  console.log();

  // --- AUTHENTICATION TESTS ---
  console.log('👉 [TEST 5] Authentication & JWT Tests...');
  const testEmail = `testathlete_${Date.now()}@example.com`;

  // 1. Missing fields
  const missingFieldRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail }),
  });
  assert('Reject registration with missing fields (400)', missingFieldRes.status === 400);

  // 2. Short password
  const shortPassRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Short Pass', email: testEmail, password: '123' }),
  });
  assert('Reject registration with short password (400)', shortPassRes.status === 400);

  // 3. Successful registration
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Athlete',
      email: testEmail,
      password: 'Password@123',
      phone: '+1 555-0199',
    }),
  });
  assert('Register new user successfully (201)', regRes.status === 201 && regRes.data?.success === true);
  const issuedToken = regRes.data?.data?.token;
  assert('Registration returns signed JWT token', !!issuedToken);
  assert('Registration masks password hash from response', regRes.data?.data?.user?.password === undefined);

  // 4. Duplicate registration
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate',
      email: testEmail,
      password: 'Password@123',
    }),
  });
  assert('Reject duplicate registration (409 Conflict)', dupRes.status === 409);

  // 5. Valid Login
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: 'Password@123' }),
  });
  assert('Login with valid credentials (200 OK)', loginRes.status === 200 && loginRes.data?.success === true);
  const userToken = loginRes.data?.data?.token;
  assert('Login issues valid JWT token', !!userToken);

  // 6. Admin Login
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@flexigym.com', password: 'Admin@123' }),
  });
  assert('Admin login succeeds with seed credentials', adminLoginRes.status === 200);
  const adminToken = adminLoginRes.data?.data?.token;

  // 7. Invalid password
  const wrongPassRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword' }),
  });
  assert('Reject login with invalid password (401)', wrongPassRes.status === 401);

  // 8. Non-existent account
  const noAccountRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent@example.com', password: 'Password@123' }),
  });
  assert('Reject non-existent account (401)', noAccountRes.status === 401);

  // 9. Protected route with valid token
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert('Access protected /auth/me with Bearer token (200 OK)', meRes.status === 200 && meRes.data?.data?.user?.email === testEmail);

  // 10. Protected route without token
  const noTokenRes = await request('/auth/me');
  assert('Reject request with missing token (401 Unauthorized)', noTokenRes.status === 401);

  // 11. Malformed token
  const malformedRes = await request('/auth/me', {
    headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' },
  });
  assert('Reject malformed token (401 Unauthorized)', malformedRes.status === 401);

  // 12. Expired token
  const expiredToken = jwt.sign(
    { id: 'fake_id', email: 'expired@test.com', role: 'member' },
    JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );
  const expiredRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert('Reject expired JWT token (401 Unauthorized)', expiredRes.status === 401);

  // 13. Admin role enforcement
  const unauthorizedAdminRes = await request('/members', {
    headers: { Authorization: `Bearer ${userToken}` }, // Normal member token
  });
  assert('Reject non-admin from admin-only route (403 Forbidden)', unauthorizedAdminRes.status === 403);

  const authorizedAdminRes = await request('/members', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Allow admin to access admin-only route (200 OK)', authorizedAdminRes.status === 200);

  // 14. Logout
  const logoutRes = await request('/auth/logout', { method: 'POST' });
  assert('POST /auth/logout succeeds (200 OK)', logoutRes.status === 200);
  console.log();

  // --- API INTEGRATION TESTS ---
  console.log('👉 [TEST 6] Business API & Data Persistence Tests...');
  // Public Plans
  const plansRes = await request('/plans');
  assert('GET /api/plans returns public memberships', plansRes.status === 200 && Array.isArray(plansRes.data?.data));

  // Public Trainers
  const trainersRes = await request('/trainers');
  assert('GET /api/trainers returns coach rosters', trainersRes.status === 200 && Array.isArray(trainersRes.data?.data));

  // Public Schedules
  const schedulesRes = await request('/schedules');
  assert('GET /api/schedules returns class timetable', schedulesRes.status === 200 && Array.isArray(schedulesRes.data?.data));

  // Enquiry Submission
  const enquiryRes = await request('/enquiries', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Prospect Member',
      email: 'prospect@gym.com',
      phone: '555-1234',
      subject: 'Trial Pass',
      message: 'Interested in a trial week.',
    }),
  });
  assert('POST /api/enquiries submits contact message (201 Created)', enquiryRes.status === 201);

  // Appointment Booking
  const bookingDate = `2026-12-${String(Math.floor(1 + Math.random() * 25)).padStart(2, '0')}`;
  const apptRes = await request('/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      memberName: 'Test Athlete',
      memberEmail: testEmail,
      memberPhone: '555-0199',
      service: '1-on-1 Fitness Assessment',
      date: bookingDate,
      timeSlot: '09:00 AM',
    }),
  });
  assert('POST /api/appointments reserves training slot (201 Created)', apptRes.status === 201, `Status: ${apptRes.status}, Message: ${apptRes.data?.message}`);

  // Dashboard Stats (Admin)
  const statsRes = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/dashboard/stats returns club KPIs (200 OK)', statsRes.status === 200 && typeof statsRes.data?.data?.activeMembers === 'number');

  // Equipment List
  const equipRes = await request('/equipment');
  assert('GET /api/equipment returns facility assets', equipRes.status === 200 && Array.isArray(equipRes.data?.data));

  // Inventory List
  const invRes = await request('/inventory');
  assert('GET /api/inventory returns pro shop products', invRes.status === 200 && Array.isArray(invRes.data?.data));

  // Compass Summary
  const compassRes = await request('/compass/summary', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/compass/summary returns database collection stats', compassRes.status === 200 && Array.isArray(compassRes.data?.data?.collections));

  console.log();
  console.log('====================================================');
  console.log(`🏁 TEST RESULTS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  server.close();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runAllTests().catch((err) => {
  console.error('Test Runner encountered unhandled exception:', err);
  process.exit(1);
});
