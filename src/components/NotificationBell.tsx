import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, User } from '../types';

interface NotificationBellProps {
  currentUser: User | null;
  onOpenTracker?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser, onOpenTracker }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'bids' | 'escrow'>('all');
  const [loading, setLoading] = useState(false);
  const [newToast, setNewToast] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prevCountRef = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&role=${currentUser.role}`);
      if (!res.ok) return;
      const data = await res.json();
      const notifs: AppNotification[] = data.notifications || [];
      
      // Check for incoming new unread notifications to trigger toast
      const unread = notifs.filter(n => !n.isRead);
      if (prevCountRef.current > 0 && unread.length > prevCountRef.current) {
        const newest = unread[0];
        if (newest) {
          setNewToast(newest);
          setTimeout(() => setNewToast(null), 5000);
        }
      }
      prevCountRef.current = unread.length;
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      prevCountRef.current = 0;
      return;
    }

    fetchNotifications();

    let intervalId: any = null;
    const startPolling = () => {
      if (!intervalId && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        intervalId = setInterval(fetchNotifications, 30000); // 30-second poll interval
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchNotifications);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [currentUser?.id, currentUser?.role]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, role: currentUser.role })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, role: currentUser.role })
      });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.bookingId && (notif.type === 'escrow' || notif.type === 'payout') && onOpenTracker) {
      onOpenTracker();
      return;
    }

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bids') return ['bid', 'counter', 'accept'].includes(n.type);
    if (filter === 'escrow') return ['escrow', 'payout', 'booking'].includes(n.type);
    return true;
  });

  const getIconColor = (type: string) => {
    switch (type) {
      case 'bid': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'accept': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'counter': return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'chat': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'booking': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'payout': return 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40';
      case 'escrow': return 'text-amber-300 bg-amber-500/20 border-amber-400/40';
      case 'kyc': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default: return 'text-slate-300 bg-slate-700/50 border-slate-600/40';
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center"
        title="In-App Notifications"
      >
        <span className="material-symbols-outlined text-lg">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Instant Toast on New Event */}
      {newToast && (
        <div
          onClick={() => handleNotificationClick(newToast)}
          className="fixed bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[9999] max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-teal-500 shadow-2xl rounded-2xl p-4 text-white cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 animate-fade-in"
        >
          <div className="flex items-start space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getIconColor(newToast.type)}`}>
              <span className="material-symbols-outlined text-lg">{newToast.icon || 'notifications'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-teal-300 truncate">{newToast.title}</p>
                <span className="text-[10px] text-slate-400 shrink-0">Just now</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">{newToast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewToast(null);
              }}
              className="text-slate-400 hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 max-w-md mx-auto sm:mx-0 sm:fixed sm:top-16 sm:right-6 sm:left-auto sm:w-96 md:absolute md:top-full md:mt-2 md:right-0 md:inset-x-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[9999] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Top Bar Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
              </div>
              <span className="text-sm font-black text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 font-black text-[10px]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-[11px] font-bold text-teal-400 hover:text-teal-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 p-2 bg-slate-900 border-b border-slate-800 text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === 'unread' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('bids')}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === 'bids' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Bids & Offers
            </button>
            <button
              onClick={() => setFilter('escrow')}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === 'escrow' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Escrow & Payouts
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[min(20rem,calc(100vh-14rem))] overflow-y-auto divide-y divide-slate-800 bg-slate-900">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-900">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-2 border border-slate-700">
                  <span className="material-symbols-outlined text-2xl">notifications_off</span>
                </div>
                <p className="text-xs font-bold text-slate-300">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You'll be notified of new bids, tour bookings, chat messages, and escrow payouts.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 transition-colors cursor-pointer flex items-start space-x-3 group relative ${
                    notif.isRead
                      ? 'bg-slate-900 hover:bg-slate-800'
                      : 'bg-slate-800 hover:bg-slate-750 border-l-2 border-teal-400'
                  }`}
                >
                  {/* Icon or Avatar */}
                  <div className="relative shrink-0">
                    {notif.senderAvatar ? (
                      <img
                        src={notif.senderAvatar}
                        alt={notif.senderName || 'Sender'}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${getIconColor(notif.type)}`}>
                        <span className="material-symbols-outlined text-base">
                          {notif.icon || 'notifications'}
                        </span>
                      </div>
                    )}
                    {!notif.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full ring-2 ring-slate-900" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {notif.amountUSD && (
                        <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ${notif.amountUSD} USD
                        </span>
                      )}
                      {notif.bookingId && (
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          #{notif.bookingId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action: Mark as Read Button */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      title="Mark as read"
                    >
                      <span className="material-symbols-outlined text-sm">done</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Live In-App Events & Escrow Tracking Active
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
