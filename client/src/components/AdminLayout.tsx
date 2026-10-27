import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, Award, Calendar, MessageSquare, 
  Database, Terminal, LogOut, Dumbbell, Menu, X, ArrowLeft, Shield,
  Building, Wrench, Package, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Appointments', path: '/admin/appointments', icon: <Calendar className="w-5 h-5 text-[#ff6a00]" /> },
    { name: 'Members', path: '/admin/members', icon: <Users className="w-5 h-5" /> },
    { name: 'Attendance & Gates', path: '/admin/attendance', icon: <Building className="w-5 h-5 text-blue-400" /> },
    { name: 'Equipment & Service', path: '/admin/equipment', icon: <Wrench className="w-5 h-5 text-amber-400" /> },
    { name: 'Pro Shop Inventory', path: '/admin/inventory', icon: <Package className="w-5 h-5 text-emerald-400" /> },
    { name: 'Reports & Export', path: '/admin/reports', icon: <FileText className="w-5 h-5 text-purple-400" /> },
    { name: 'Membership Plans', path: '/admin/plans', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Trainers', path: '/admin/trainers', icon: <Award className="w-5 h-5" /> },
    { name: 'Workout Schedules', path: '/admin/schedules', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Enquiries / Leads', path: '/admin/enquiries', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'MongoDB Compass', path: '/admin/compass', icon: <Database className="w-5 h-5 text-emerald-400" /> },
    { name: 'PowerShell Guide', path: '/admin/powershell', icon: <Terminal className="w-5 h-5 text-amber-400" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#121214] border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#ff6a00] flex items-center justify-center text-white font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-heading text-xl font-bold uppercase tracking-wider">
            FLEXI Admin
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#121214] border-r border-neutral-800 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-neutral-800/80">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff6a00] flex items-center justify-center text-white shadow-md shadow-[#ff6a00]/30">
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-heading text-xl font-black tracking-wider text-white">
                  FLEXI <span className="text-[#ff6a00]">.</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-[#ff6a00]">
                  Admin Dashboard
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive(item.path)
                    ? 'bg-[#ff6a00] text-white shadow-md shadow-[#ff6a00]/25'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-neutral-800 bg-[#0e0e10] space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-[#ff6a00]">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-neutral-400 truncate">{user?.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/"
              className="py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-center text-neutral-300 hover:text-white flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Public</span>
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold text-center flex items-center justify-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
