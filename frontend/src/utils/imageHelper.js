/**
 * Helper to resolve and format category, video, and banner image paths.
 * If the path is an external link (starts with http/https), it returns it as is.
 * Otherwise, it prepends the backend server host address from VITE_API_URL.
 * @param {string} path - The raw image path from database
 * @returns {string} Fully qualified image URL or placeholder fallback
 */
export const getImageUrl = (path) => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=60';
  }

  // If the path is an absolute URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendHost = apiUrl.replace(/\/api\/?$/, '');

  return `${backendHost}${cleanPath}`;
};
