import React, { useState, useEffect } from 'react';
import API from '../services/api';
import BannerSlider from '../components/BannerSlider';
import VideoCard from '../components/VideoCard';
import { Loader, Play, Sparkles, Radio, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageHelper';

const Home = () => {
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Latest videos list with pagination
  const [latestVideos, setLatestVideos] = useState([]);
  const [videoOffset, setVideoOffset] = useState(0);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load consolidated feed
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await API.get('/home/feed');
        if (response.data.success) {
          setFeedData(response.data);
          setLatestVideos(response.data.latestVideos);
          setHasMoreVideos(response.data.latestVideos.length >= 10);
        } else {
          setFeedError(response.data.message || 'Unable to load the home feed.');
        }
      } catch (error) {
        console.error('Error fetching home feed:', error);
        setFeedError(error.response?.data?.message || 'Unable to load the home feed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  // Fetch more videos (infinite scroll/pagination)
  const loadMoreVideos = async () => {
    if (loadingMore || !hasMoreVideos) return;

    setLoadingMore(true);
    try {
      const nextOffset = videoOffset + 10;
      const url = `/videos?limit=10&offset=${nextOffset}${selectedCategory ? `&category=${selectedCategory}` : ''}`;
      const response = await API.get(url);

      if (response.data.success) {
        const newVideos = response.data.videos;
        setLatestVideos((prev) => [...prev, ...newVideos]);
        setVideoOffset(nextOffset);
        setHasMoreVideos(response.data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle Category Filter
  const handleCategorySelect = async (categoryId) => {
    setLoadingMore(true);
    try {
      const newCat = selectedCategory === categoryId ? null : categoryId;
      setSelectedCategory(newCat);
      setVideoOffset(0);

      const url = `/videos?limit=10&offset=0${newCat ? `&category=${newCat}` : ''}`;
      const response = await API.get(url);

      if (response.data.success) {
        setLatestVideos(response.data.videos);
        setHasMoreVideos(response.data.hasMore);
      }
    } catch (error) {
      console.error('Error filtering videos by category:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold tracking-wide">Compiling divine feed...</span>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center text-gray-400">
        <HelpCircle size={36} className="text-amber-500" />
        <p className="text-sm font-semibold">{feedError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-400"
        >
          Try again
        </button>
      </div>
    );
  }

  const { banners, categories, liveStreams, featuredVideos } = feedData || {};

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Banner Carousel */}
      {banners && banners.length > 0 && <BannerSlider banners={banners} />}

      {/* Categories Horizontal Scroller */}
      {categories && categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span>Browse Temples</span>
          </h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scroll-smooth mask-image">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-gray-300 hover:border-zinc-700'
                    }`}
                >
                  {cat.image && (
                    <img
                      src={getImageUrl(cat.image)}
                      alt=""
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1547983125-8d57fa78302d?w=100&auto=format&fit=crop&q=60'; }}
                      className="w-5 h-5 rounded-full object-cover border border-white/10"
                    />
                  )}
                  <span>{cat.category_name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Darshan section (Only when no category filter is active) */}
      {!selectedCategory && liveStreams && liveStreams.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
              <Radio size={16} className="text-red-500 animate-pulse" />
              <span>Dev Darshan Live</span>
            </h2>
            <Link to="/live" className="text-xs text-amber-500 hover:text-amber-400 font-bold text-decoration-none">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {liveStreams.map((stream) => (
              <VideoCard key={stream.id} video={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Featured Section (Only when no category filter is active) */}
      {!selectedCategory && featuredVideos && featuredVideos.length > 0 && (
        <div className="mb-7">
          <h2 className="text-sm font-bold text-gray-200 mb-3.5 flex items-center gap-1.5">
            <Play size={16} className="text-amber-500 fill-amber-500/10" />
            <span>Featured Broadcasts</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* Latest VOD Feed */}
      <div>
        <h2 className="text-sm font-bold text-gray-200 mb-3.5 flex items-center gap-1.5">
          <Play size={16} className="text-amber-500 fill-amber-500/10" />
          <span>{selectedCategory ? 'Category Videos' : 'Latest Devotional Videos'}</span>
        </h2>

        {latestVideos && latestVideos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 glass-card rounded-2xl p-6 border border-white/5">
            <i className="fa-solid fa-video-slash fs-2 mb-2 text-zinc-700"></i>
            <p className="text-xs">No videos matching this category found.</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMoreVideos && latestVideos.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMoreVideos}
              disabled={loadingMore}
              className="btn-outline px-8 py-2.5 text-xs flex items-center gap-1.5 active:scale-95"
            >
              {loadingMore ? (
                <>
                  <Loader size={12} className="animate-spin text-amber-500" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Videos</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
