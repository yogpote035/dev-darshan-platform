import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';

const AdContext = createContext(null);

export const AdProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user || null;

  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adConfig, setAdConfig] = useState(null);
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [videosWatched, setVideosWatched] = useState(0);
  const [watchTime, setWatchTime] = useState(0); // in seconds
  const [showAdPopup, setShowAdPopup] = useState(false);

  // Determine if current user is premium (Free plan is plan_id=1, premium is plan_id > 1)
  const isPremium = user && user.plan_id > 1 && new Date(user.subscription_expiry) > new Date();

  // Load public settings and ads config
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const settingsRes = await API.get('/settings');
        if (settingsRes.data.success) {
          setSiteSettings(settingsRes.data.settings);
          setAdsEnabled(settingsRes.data.settings.free_user_ads_enabled === 1);
        }

        const adsRes = await API.get('/ads');
        if (adsRes.data.success && adsRes.data.ads.length > 0) {
          // Use the latest active ad campaign
          setAdConfig(adsRes.data.ads[0]);
        }

        const feedRes = await API.get('/home/feed');
        if (feedRes.data.success) {
          const lowestPremiumPlan = feedRes.data.plans
            .filter((plan) => plan.status === 1 && Number(plan.price) > 0)
            .sort((firstPlan, secondPlan) => Number(firstPlan.price) - Number(secondPlan.price))[0];
          setPremiumPlan(lowestPremiumPlan || null);
        }
      } catch (error) {
        console.error('Error fetching ad configurations:', error);
      }
    };

    fetchConfigs();
  }, []);

  // Timer to track watch time when an ad is active and user is watching
  useEffect(() => {
    let timer;
    const shouldTrack = adsEnabled && !isPremium && adConfig && !showAdPopup;

    if (shouldTrack) {
      timer = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          const limit = (adConfig.display_after_minutes || 5) * 60;
          if (newTime >= limit) {
            setShowAdPopup(true);
            return 0; // Reset counter
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [adsEnabled, isPremium, adConfig, showAdPopup]);

  const incrementVideosWatched = () => {
    if (!adsEnabled || isPremium || !adConfig) return;

    setVideosWatched((prev) => {
      const newVal = prev + 1;
      const limit = adConfig.display_after_videos || 2;
      if (newVal >= limit) {
        setShowAdPopup(true);
        return 0; // Reset counter
      }
      return newVal;
    });
  };

  const closeAd = () => {
    setShowAdPopup(false);
    // Reset watch time to start accumulating again
    setWatchTime(0);
    setVideosWatched(0);
  };

  return (
    <AdContext.Provider value={{
      showAdPopup,
      currentAd: adConfig,
      incrementVideosWatched,
      closeAd,
      isPremium,
      premiumPlan,
      siteSettings
    }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => useContext(AdContext);
