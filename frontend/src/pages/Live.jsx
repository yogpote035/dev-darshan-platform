import React, { useState, useEffect } from 'react';
import API from '../services/api';
import VideoCard from '../components/VideoCard';
import { Loader, Radio } from 'lucide-react';

const Live = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveFeeds = async () => {
      try {
        const response = await API.get('/videos?type=live');
        if (response.data.success) {
          setStreams(response.data.videos);
        }
      } catch (error) {
        console.error('Error fetching live feeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveFeeds();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Tuning live broadcast feeds...</span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-5">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-liveRed"></span>
        </span>
        <h1 className="text-lg font-bold text-gray-100 uppercase tracking-wide">Dev Darshan Live Channels</h1>
      </div>

      {streams && streams.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {streams.map((stream) => (
            <VideoCard key={stream.id} video={stream} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 glass-card rounded-3xl p-8 border border-white/5 max-w-md mx-auto">
          <Radio size={48} className="mx-auto mb-4 text-zinc-700 animate-pulse" />
          <h3 className="text-gray-300 font-bold mb-1">No Channels Live</h3>
          <p className="text-xs">There are no live temple feeds active at this hour. Please check back during Aarti timings or watch recorded Darshans.</p>
        </div>
      )}
    </div>
  );
};

export default Live;
