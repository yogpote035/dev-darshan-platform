/**
 * Extract YouTube video ID from various YouTube URL formats.
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if not found
 */
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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
