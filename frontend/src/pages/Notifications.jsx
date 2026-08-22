import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader, Bell, CheckSquare, Trash2, MailOpen, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageHelper';

const Notifications = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchNotifications();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated]);

  const handleMarkAsRead = async (userNotifId) => {
    try {
      const response = await API.post(`/notifications/${userNotifId}/read`);
      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === userNotifId ? { ...notif, is_read: 1 } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const response = await API.post('/notifications/read-all');
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: 1 }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Opening notification vault...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-amber-500" />
          <h1 className="text-lg font-bold text-gray-100 uppercase tracking-wide">Inbox</h1>
          {unreadCount > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors bg-transparent border-0 active:scale-95 disabled:opacity-50"
          >
            <CheckSquare size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((item) => {
            const detail = item.Notification;
            if (!detail) return null;
            const isUnread = item.is_read === 0;

            return (
              <div
                key={item.id}
                onClick={() => isUnread && handleMarkAsRead(item.id)}
                className={`glass-card rounded-2xl p-4 border transition-all duration-300 ${
                  isUnread 
                    ? 'border-amber-500/25 bg-amber-500/[0.01] cursor-pointer' 
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex gap-4">
                  {/* Visual Graphic */}
                  {detail.image ? (
                    <img 
                      src={getImageUrl(detail.image)} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/5 shrink-0" 
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnread 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse' 
                        : 'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}>
                      <Bell size={18} />
                    </div>
                  )}

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className={`text-xs font-bold text-gray-200 line-clamp-1 ${isUnread ? 'text-amber-500' : 'text-gray-200'}`}>
                        {detail.title}
                      </h3>
                      <span className="text-[9px] text-gray-500 font-semibold shrink-0">
                        {new Date(detail.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-2.5">{detail.message}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">
                        {new Date(detail.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      {isUnread ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          className="text-[9px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 border-0 bg-transparent"
                        >
                          <Mail size={12} />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-gray-500 flex items-center gap-1">
                          <MailOpen size={10} />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 glass-card rounded-3xl p-8 border border-white/5 max-w-sm mx-auto">
          <Bell size={40} className="mx-auto mb-3 text-zinc-700" />
          <h3 className="text-gray-300 font-bold mb-1 text-sm">Inbox is Empty</h3>
          <p className="text-xs">You do not have any notification messages. We will keep you updated about Aarti and special events.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
