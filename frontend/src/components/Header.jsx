import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAds } from '../context/AdContext';
import { Crown, HelpCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageHelper';

const Header = () => {
  const { isAuthenticated, user } = useAuth();
  const { isPremium, siteSettings } = useAds();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 border-b border-zinc-800/50 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-decoration-none">
        <span className="text-2xl text-amber-500 font-bold flex items-center gap-1.5">
          {siteSettings?.logo ? (
            <img
              src={getImageUrl(siteSettings.logo)}
              alt={siteSettings.site_name || 'Site logo'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <i className="fa-solid fa-om text-amber-500 animate-pulse-slow"></i>
          )}
          <span className="tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Dev Darshan Live</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Notifications Shortcut */}
        {isAuthenticated && (
          <Link to="/notifications" className="text-gray-400 hover:text-amber-500 transition-colors" title="Inbox Announcements">
            <Bell size={20} />
          </Link>
        )}

        {/* Support contact info shortcut */}
        <Link to="/contact" className="text-gray-400 hover:text-amber-500 transition-colors" title="Contact Support">
          <HelpCircle size={22} />
        </Link>

        {isAuthenticated && (
          <div>
            {isPremium ? (
              <Link to="/subscription" className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md shadow-amber-500/20 hover:scale-105 transition-transform">
                <Crown size={12} className="fill-white" />
                <span>Premium</span>
              </Link>
            ) : (
              <Link to="/subscription" className="bg-zinc-800 border border-zinc-700 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-zinc-700 transition-colors">
                Upgrade
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
