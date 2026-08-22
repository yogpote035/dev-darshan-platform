import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Radio, Sparkles, ShoppingBag, User, Gift } from 'lucide-react';

const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-900 px-2 py-2.5 flex items-center justify-around shadow-2xl">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/live"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all relative ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <Radio size={20} />
        <span>Live feeds</span>
        <span className="absolute -top-1 right-2 w-2 h-2 bg-liveRed rounded-full animate-ping"></span>
      </NavLink>

      <NavLink
        to="/subscription"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <Sparkles size={20} />
        <span>Plans</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <ShoppingBag size={20} />
        <span>Store</span>
      </NavLink>

      <NavLink
        to="/refer"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <Gift size={20} />
        <span>Refer & Earn</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${isActive ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
