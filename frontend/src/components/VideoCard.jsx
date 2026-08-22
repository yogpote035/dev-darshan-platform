import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Folder } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, total_views, is_live, Category } = video;

  return (
    <Link to={`/video/${id}`} className="group block glass-card glass-card-hover rounded-2xl overflow-hidden shadow-lg mb-0 text-decoration-none">
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={getImageUrl(thumbnail)}
          alt={title}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=60'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Play hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <div className="bg-amber-500 text-white p-3.5 rounded-full scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-amber-500/30">
            <Play size={22} className="fill-white translate-x-0.5" />
          </div>
        </div>

        {/* Live Badge */}
        {is_live === 1 && (
          <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-md shadow-red-650/25 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            <span>Dev Darshan Live</span>
          </div>
        )}

        {/* Category Tag */}
        {Category && (
          <div className="absolute bottom-3 right-3 bg-black/75 border border-white/5 backdrop-blur-sm text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
            <Folder size={10} />
            <span>{Category.category_name}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors text-sm mb-2.5">
          {title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            <span>{total_views.toLocaleString()} views</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
