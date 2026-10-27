import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Calendar, AlertTriangle, CreditCard, Dumbbell, Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'expiry' | 'challenge' | 'workout' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'expiry':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'challenge':
        return <Award className="w-4 h-4 text-[#ff6a00]" />;
      case 'workout':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff6a00] text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-md shadow-[#ff6a00]/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#161618] border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-black tracking-wider text-white uppercase">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#ff6a00]/20 text-[#ff6a00] text-xs font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-neutral-400 hover:text-[#ff6a00] font-semibold transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    n.isRead ? 'bg-transparent hover:bg-neutral-800/30' : 'bg-[#ff6a00]/5 hover:bg-[#ff6a00]/10'
                  }`}
                >
                  <div className="mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-neutral-300' : 'text-white'}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#ff6a00] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-[#ff6a00] font-bold hover:underline flex items-center gap-0.5"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-neutral-900/60 border-t border-neutral-800 text-center">
            <span className="text-[11px] text-neutral-500 font-medium">
              FLEXI Athletic Club Member Alert Service
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
