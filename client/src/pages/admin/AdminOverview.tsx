import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Award, MessageSquare, CreditCard, 
  TrendingUp, Calendar, CalendarCheck, AlertCircle, ArrowRight, PlusCircle, CheckCircle2 
} from 'lucide-react';
import api from '../../api/client';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers ?? 0,
      sub: 'Registered athlete accounts',
      icon: <Users className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5',
      link: '/admin/members',
    },
    {
      title: 'Active Memberships',
      value: stats?.activeMembers ?? 0,
      sub: 'Currently valid passes',
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/5',
      link: '/admin/members?status=active',
    },
    {
      title: 'Expired Passes',
      value: stats?.expiredMemberships ?? 0,
      sub: 'Requires renewal / re-engagement',
      icon: <UserX className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/5',
      link: '/admin/members?status=expired',
    },
    {
      title: 'Certified Trainers',
      value: stats?.totalTrainers ?? 0,
      sub: 'Active master coaches',
      icon: <Award className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/5',
      link: '/admin/trainers',
    },
    {
      title: 'Total Enquiries',
      value: stats?.totalEnquiries ?? 0,
      sub: `${stats?.pendingEnquiries ?? 0} pending review`,
      icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/5',
      link: '/admin/enquiries',
    },
    {
      title: 'Booked Sessions',
      value: stats?.totalAppointments ?? 0,
      sub: `${stats?.pendingAppointments ?? 0} pending approval`,
      icon: <CalendarCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/5',
      link: '/admin/appointments',
    },
    {
      title: 'Gross Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      sub: 'From membership enrollments',
      icon: <TrendingUp className="w-5 h-5 text-[#ff6a00]" />,
      color: 'border-[#ff6a00]/30 bg-[#ff6a00]/5',
      link: '/admin/plans',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Club Analytics & Operations
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time aggregate data queried from local MongoDB database (`gym_management`).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/members"
            className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#ff6a00]/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Member</span>
          </Link>
          <Link
            to="/admin/compass"
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-neutral-700"
          >
            <span>Compass View</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className={`p-6 rounded-2xl border ${card.color} hover:border-[#ff6a00]/60 transition-all flex flex-col justify-between group shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                {card.icon}
              </div>
            </div>

            <div className="font-heading text-4xl sm:text-5xl font-black text-white">
              {loading ? '...' : card.value}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-800/60">
              <span>{card.sub}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#ff6a00]" />
            </div>
          </Link>
        ))}
      </div>

      {/* 2-Column Tables: Recent Members & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Members */}
        <div className="p-6 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff6a00]" />
              <h3 className="font-heading text-xl font-black uppercase text-white">
                Recent Member Signups
              </h3>
            </div>
            <Link to="/admin/members" className="text-xs font-bold text-[#ff6a00] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentMembers?.length === 0 && (
              <div className="py-6 text-center text-xs text-neutral-500">No members registered yet.</div>
            )}
            {stats?.recentMembers?.map((m: any) => (
              <div
                key={m._id}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{m.name}</div>
                  <div className="text-neutral-400">{m.email}</div>
                  {m.phone && <div className="text-neutral-500 text-[11px]">{m.phone}</div>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Joined</span>
                  <div className="text-neutral-300 font-mono text-[11px]">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Enquiries */}
        <div className="p-6 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h3 className="font-heading text-xl font-black uppercase text-white">
                Recent Public Enquiries
              </h3>
            </div>
            <Link to="/admin/enquiries" className="text-xs font-bold text-[#ff6a00] hover:underline">
              Manage Leads
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentEnquiries?.length === 0 && (
              <div className="py-6 text-center text-xs text-neutral-500">No public inquiries submitted yet.</div>
            )}
            {stats?.recentEnquiries?.map((e: any) => (
              <div
                key={e._id}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{e.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      e.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : e.status === 'contacted'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px] font-medium mt-0.5">{e.subject}</div>
                  <p className="text-neutral-500 text-[11px] truncate mt-1">{e.message}</p>
                </div>
                <div className="text-right text-[10px] text-neutral-500 shrink-0">
                  {new Date(e.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Booked Coaching & Scan Sessions */}
      <div className="p-6 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading text-xl font-black uppercase text-white">
              Recent Appointment Reservations & Consults
            </h3>
          </div>
          <Link to="/admin/appointments" className="text-xs font-bold text-[#ff6a00] hover:underline">
            Manage All Bookings
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(!stats?.recentAppointments || stats?.recentAppointments?.length === 0) && (
            <div className="col-span-full py-6 text-center text-xs text-neutral-500">
              No appointments reserved yet.
            </div>
          )}
          {stats?.recentAppointments?.map((a: any) => (
            <div
              key={a._id}
              className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-white truncate text-sm">{a.memberName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : a.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-400'
                      : a.status === 'cancelled'
                      ? 'bg-neutral-800 text-neutral-400 line-through'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <div className="text-[#ff6a00] font-medium text-xs line-clamp-1">{a.service}</div>
                <div className="text-neutral-400 text-[11px] mt-0.5">
                  Coach: <span className="text-neutral-300 font-medium">{a.trainerName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-neutral-800/60 font-mono text-[11px] text-neutral-400">
                <span className="text-white font-medium">{a.date}</span>
                <span className="text-[#ff6a00]">{a.timeSlot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
