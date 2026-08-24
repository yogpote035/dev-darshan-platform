const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract a YouTube video ID from watch, share, embed, shorts, or live URLs.
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if not found
 */
const getYoutubeId = (url) => {
  if (typeof url !== 'string' || !url.trim()) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  if (!YOUTUBE_HOSTS.has(hostname)) return null;

  let videoId = null;
  if (hostname === 'youtu.be') {
    videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
  } else if (parsedUrl.pathname === '/watch') {
    videoId = parsedUrl.searchParams.get('v');
  } else {
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (['embed', 'live', 'shorts', 'v'].includes(pathParts[0])) {
      videoId = pathParts[1];
    }
  }

  return VIDEO_ID_PATTERN.test(videoId || '') ? videoId : null;
};

/**
 * Generate standard YouTube embed URL.
 * @param {string} url - YouTube URL
 * @returns {string|null} Embed URL or null if not valid
 */
const getEmbedUrl = (url) => {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

module.exports = {
  getYoutubeId,
  getEmbedUrl
};
