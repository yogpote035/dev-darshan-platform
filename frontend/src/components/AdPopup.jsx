import React, { useEffect, useState } from 'react';
import { useAds } from '../context/AdContext';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';

const AdPopup = () => {
  const navigate = useNavigate();
  const { showAdPopup, currentAd, closeAd, premiumPlan } = useAds();
  const [countdown, setCountdown] = useState(5); // Show close button after 5 seconds
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!showAdPopup) {
      setCountdown(5);
      setCanClose(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showAdPopup]);

  if (!showAdPopup || !currentAd) return null;

  const premiumPrice = premiumPlan ? Number(premiumPlan.price).toLocaleString('en-IN') : '99';
  const premiumDuration = premiumPlan?.duration_days === 30 ? 'month' : `${premiumPlan?.duration_days || 30} days`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-5 flex flex-col items-center">

        {/* Ad Title & Header */}
        <div className="text-center mb-4">
          <span className="bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-amber-500/10">Sponsored Ad</span>
          <h3 className="text-lg font-bold text-gray-100 mt-2.5">{currentAd.title}</h3>
        </div>

        {/* Ad Image / Banner */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-white/5 mb-4 group">
          <img
            src={getImageUrl(currentAd.image)}
            alt={currentAd.title}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'; }}
            className="w-full h-full object-cover"
          />
          {currentAd.redirect_url && (
            <a
              href={currentAd.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white font-semibold gap-1.5"
            >
              <span>Visit Site</span>
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        {/* Call to Action Button */}
        {currentAd.redirect_url && (
          <a
            href={currentAd.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-gold text-center py-3.5 mb-4 flex items-center justify-center gap-1.5 text-sm text-decoration-none"
          >
            <span>Learn More</span>
            <ExternalLink size={16} />
          </a>
        )}

        {/* Close Controls */}
        <div className="w-full flex justify-center">
          {canClose ? (
            <button
              onClick={closeAd}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-semibold px-6 py-2.5 rounded-full transition-all border border-zinc-700 active:scale-95"
            >
              <X size={16} />
              <span>Close Advertisement</span>
            </button>
          ) : (
            <div className="text-xs text-gray-500 font-medium py-2">
              You can close this ad in <span className="text-amber-500 font-bold text-sm mx-0.5">{countdown}</span> seconds...
            </div>
          )}
        </div>

        {/* Quick Premium Upgrade Shortcut */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 w-full text-center">
          <p className="text-[11px] text-gray-400">
            Tired of ads?{' '}
            <button
              onClick={() => { closeAd(); navigate('/subscription'); }}
              className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors"
            >
              Go Premium for ₹{premiumPrice}/{premiumDuration}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdPopup;
