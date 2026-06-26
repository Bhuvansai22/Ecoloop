export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseURL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';
  return `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
};
