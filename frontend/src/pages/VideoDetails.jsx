import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getImageUrl } from '../utils/imageHelper';
import { useAuth } from '../context/AuthContext';
import { useAds } from '../context/AdContext';
import { Loader, Heart, Eye, Folder, ChevronRight, Play } from 'lucide-react';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { isAuthenticated } = useAuth();
  const { incrementVideosWatched } = useAds();

  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  // 1. Fetch Video details and log watch history
  useEffect(() => {
    const loadVideoData = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/videos/${id}`);
        if (response.data.success) {
          const videoData = response.data.video;
          setVideo(videoData);

          // Trigger view interval counter for advertisements popup scheduling
          incrementVideosWatched();

          // Fetch related videos from same category
          const relatedRes = await API.get(`/videos?limit=5&category=${videoData.category_id || ''}`);
          if (relatedRes.data.success) {
            // Exclude current video
            const filtered = relatedRes.data.videos.filter((v) => v.id !== parseInt(id));
            setRelated(filtered);
          }

          // If authenticated, check favorite status and log watch history
          if (isAuthenticated) {
            // Log watch history
            API.post('/history', { video_id: id }).catch((err) => console.error(err));

            // Check if this video is in user's favorites
            const favRes = await API.get('/favorites');
            if (favRes.data.success) {
              const matches = favRes.data.favorites.some((fav) => fav.video_id === parseInt(id));
              setIsFavorite(matches);
            }
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [id, isAuthenticated]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setTogglingFav(true);
    try {
      const response = await API.post('/favorites/toggle', { video_id: id });
      if (response.data.success) {
        setIsFavorite(response.data.favorited);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setTogglingFav(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Tuning stream frequency...</span>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Video Player */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-white/5 mb-4">
        {video.embed_url ? (
          <iframe 
            src={video.embed_url} 
            title={video.title} 
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Player unavailable
          </div>
        )}
      </div>

      {/* Video Metadata Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h1 className="text-base font-bold text-gray-100 leading-snug">{video.title}</h1>
          
          <button
            onClick={handleToggleFavorite}
            disabled={togglingFav}
            className={`p-2 rounded-full border transition-all shrink-0 active:scale-90 ${
              isFavorite 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-gray-200'
            }`}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart size={20} className={isFavorite ? 'fill-amber-500' : ''} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            <span>{video.total_views.toLocaleString()} views</span>
          </span>
          {video.Category && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Folder size={12} />
                <span>{video.Category.category_name}</span>
              </span>
            </>
          )}
          {video.is_live === 1 && (
            <>
              <span>•</span>
              <span className="bg-red-650/15 border border-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded text-[10px]">LIVE</span>
            </>
          )}
        </div>
      </div>

      {/* Description Panel */}
      {video.description && (
        <div className="glass-card rounded-2xl p-4 border border-zinc-800 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Darshan Details</h3>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{video.description}</p>
        </div>
      )}

      {/* Related Videos List */}
      <div>
        <h3 className="text-sm font-bold text-gray-200 mb-4">Related Darshans</h3>
        {related && related.length > 0 ? (
          <div className="space-y-3">
            {related.map((item) => (
              <Link 
                key={item.id} 
                to={`/video/${item.id}`}
                className="flex gap-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/40 rounded-2xl p-2.5 transition-colors group text-decoration-none"
              >
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 bg-zinc-950">
                  <img 
                    src={getImageUrl(item.thumbnail)} 
                    alt="" 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=60'; }}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play size={14} className="fill-white text-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h4 className="font-semibold text-gray-200 text-xs line-clamp-2 group-hover:text-amber-500 transition-colors leading-snug mb-1">{item.title}</h4>
                  <span className="text-[10px] text-gray-500 font-bold">{item.Category?.category_name || 'Darshan'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-xs">
            No related videos found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetails;
