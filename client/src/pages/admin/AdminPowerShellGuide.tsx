import React from 'react';
import { Terminal, Copy, CheckCircle, Database, Shield, Folder, ExternalLink } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminPowerShellGuide: React.FC = () => {
  const { success } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Command copied to clipboard!');
  };

  const steps = [
    {
      title: '1. Clone & Project Directory Structure',
      folder: 'Project Root Directory (e.g. C:\\Projects\\flexi-gym)',
      desc: 'Verify the dual frontend and backend workspace layout.',
      cmd: `# Check root structure in Windows PowerShell
Get-ChildItem -Path .`,
    },
    {
      title: '2. Backend Dependencies Installation',
      folder: 'backend folder (cd backend)',
      desc: 'Install Express 4, Mongoose 8, bcryptjs, jsonwebtoken, cors, helmet, and cookie-parser.',
      cmd: `cd backend
npm install`,
    },
    {
      title: '3. Configure Environment Variables (.env)',
      folder: 'backend folder',
      desc: 'Create or update backend/.env with your local MongoDB connection and initial admin credentials.',
      cmd: `# Create .env from example template
Copy-Item .env.example .env

# Verify content in PowerShell
Get-Content .env`,
    },
    {
      title: '4. Start MongoDB Server & Seed Database',
      folder: 'backend folder',
      desc: 'Ensure local MongoDB Community Server (v7 or v8) is running on port 27017, then run the seed script to create initial admin and plans.',
      cmd: `# Verify local MongoDB service status on Windows
Get-Service -Name MongoDB

# Seed admin and membership plans into MongoDB
node scripts/seed.js`,
    },
    {
      title: '5. Launch Express Backend Server',
      folder: 'backend folder',
      desc: 'Run the CommonJS backend with nodemon for live hot-reloading.',
      cmd: `npm run dev
# Backend starts listening on http://localhost:5000`,
    },
    {
      title: '6. Frontend Setup & Launch (Vite + React)',
      folder: 'Root Directory in a second PowerShell window',
      desc: 'Install root packages and boot the Vite development server on port 3000.',
      cmd: `# Open new PowerShell terminal at project root
npm install
npm run dev
# Frontend runs on http://localhost:3000`,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      
      {/* Header */}
      <div className="pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
          <Terminal className="w-4 h-4" />
          Windows PowerShell Execution Guide
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
          FLEXI College Project Setup (Windows)
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Step-by-step PowerShell instructions, folder locations, seed script execution, and MongoDB Compass verification.
        </p>
      </div>

      {/* Compass Connection Highlights */}
      <div className="p-6 rounded-2xl bg-[#121214] border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold uppercase text-white">
              MongoDB Compass Inspection Guide
            </h3>
            <p className="text-xs text-neutral-400">
              How to view and inspect all 6 collections directly inside MongoDB Compass GUI:
            </p>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-300 pl-2 leading-relaxed">
          <li>Open <strong>MongoDB Compass</strong> on Windows.</li>
          <li>Paste the connection string: <code className="bg-neutral-900 px-2 py-0.5 rounded text-emerald-400 font-mono">mongodb://127.0.0.1:27017/gym_management</code></li>
          <li>Click <strong>Connect</strong>.</li>
          <li>Select the <code className="text-white font-mono">gym_management</code> database in the left sidebar.</li>
          <li>Inspect the 6 collections:
            <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">users</strong>: Accounts with bcrypt hashed passwords (`select:false`) & unique email index.</li>
              <li><strong className="text-neutral-200">membershipplans</strong>: Monthly ($49), Quarterly ($129), Yearly ($399).</li>
              <li><strong className="text-neutral-200">memberships</strong>: User & Plan references with start/end dates.</li>
              <li><strong className="text-neutral-200">trainers</strong>: Coach credentials, photoUrls, and specializations.</li>
              <li><strong className="text-neutral-200">workoutschedules</strong>: Scheduled classes with trainer ObjectId references.</li>
              <li><strong className="text-neutral-200">enquiries</strong>: Contact leads with pending/contacted/resolved statuses.</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Step by step PowerShell commands */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-heading text-xl font-bold uppercase text-white">
                {step.title}
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-[#ff6a00] font-mono">
                <Folder className="w-3.5 h-3.5" />
                <span>Runs in: {step.folder}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400">{step.desc}</p>

            <div className="relative group">
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
                {step.cmd}
              </pre>
              <button
                onClick={() => copyToClipboard(step.cmd)}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 hover:text-white font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-3 h-3 text-[#ff6a00]" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
