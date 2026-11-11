import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Bell, ArrowLeft, ChevronRight, Check } from 'lucide-react';

const CitizenNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try { await api.put(`/notifications/${n.id}/read`); } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D]">
                Updates
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-[#FF8A3D] text-white px-2 py-0.2 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
              My Notifications
            </h1>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-white-outline text-xs py-1.5 px-3 hover:border-[#FF8A3D]"
            >
              <Check className="w-3.5 h-3.5 text-[#20A779]" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="civic-card p-12 text-center text-[#747982] text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="civic-card p-12 text-center text-[#747982]">
            <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#202226] text-sm mb-1">No notifications yet</h3>
            <p className="text-xs text-[#747982]">
              You will receive automated updates when your complaint status changes or field repairs conclude.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`civic-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                  !n.read ? 'border-l-4 border-l-[#FF8A3D] bg-white' : 'bg-[#F4F5F6]/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm leading-relaxed ${!n.read ? 'font-bold text-[#202226]' : 'text-[#747982]'}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-[#747982] mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  {n.issueId && (
                    <Link
                      to={`/citizen/issues/${n.issueId}`}
                      className="text-xs font-bold text-[#FF8A3D] hover:text-[#F37B2B] mt-1.5 inline-flex items-center gap-1"
                    >
                      <span>View Complaint &amp; Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="btn-white-outline text-[11px] py-1 px-2.5 shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenNotifications;
