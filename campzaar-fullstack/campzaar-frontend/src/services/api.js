const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api'; // priyal
export const API_ORIGIN = BASE.replace(/\/api\/?$/, '');

export function resolveMediaUrl(url) {
  if (!url) return '';
  try {
    if (/^https?:\/\//i.test(url)) {
      // If the URL points to the backend uploads path but a different host
      // (e.g. leftover 10.80.94.118), normalize it to the current API origin.
      const parsed = new URL(url);
      if (parsed.pathname && parsed.pathname.startsWith('/uploads')) {
        return `${API_ORIGIN}${parsed.pathname}`;
      }
      return url;
    }

    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  } catch (e) {
    return url;
  }
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function normalizeListing(listing) {
  if (!listing) return listing;

  const images = Array.isArray(listing.images)
    ? listing.images.map(resolveMediaUrl).filter(Boolean)
    : [];
  const sellerName = listing.seller?.name || listing.seller?.full_name || listing.seller?.username || 'Unknown Seller';

  return {
    ...listing,
    images,
    image: resolveMediaUrl(listing.image) || images[0] || '',
    originalPrice: listing.originalPrice ?? listing.original_price ?? null,
    tags: Array.isArray(listing.tags) ? listing.tags : [],
    startup: listing.startup || null,
    seller: listing.seller
      ? {
          ...listing.seller,
          name: sellerName,
          avatar: listing.seller.avatar || initials(sellerName),
          avatar_url: resolveMediaUrl(listing.seller.avatar_url),
        }
      : null,
  };
}

function getToken() {
  return localStorage.getItem('cz_token');
}

async function request(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth || getToken()) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;

  try {
    data = await res.json(); // priyal
  } catch (e) {
    throw new Error("Invalid response from server"); // priyal
  }

  if (!res.ok) {
    throw new Error(data?.error || 'Request failed'); // priyal
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body, false),
  login: (body) => request('POST', '/auth/login', body, false),
  me: () => request('GET', '/auth/me'),
  updateProfile: (body) => request('PUT', '/auth/profile', body),

  // Listings
  getListings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/listings${q ? '?' + q : ''}`, null, false)
      .then((data) => ({
        ...data,
        listings: Array.isArray(data.listings) ? data.listings.map(normalizeListing) : [],
      }));
  },
  getListing: (id) => request('GET', `/listings/${id}`, null, false).then(normalizeListing),
  createListing: (body) => request('POST', '/listings', body),
  updateListing: (id, body) => request('PUT', `/listings/${id}`, body),
  deleteListing: (id) => request('DELETE', `/listings/${id}`),
  likeListing: (id) => request('POST', `/listings/${id}/like`),
  toggleWishlist: (id) => request('POST', `/listings/${id}/wishlist`),
  getWishlist: () => request('GET', '/listings/wishlist')
    .then((data) => Array.isArray(data) ? data.map(normalizeListing) : []),
  getUserListings: (userId) => request('GET', `/listings/user/${userId}`, null, false)
    .then((data) => Array.isArray(data) ? data.map(normalizeListing) : []),

  // Conversations
  getConversations: () => request('GET', '/conversations'),
  getMessages: (convId) => request('GET', `/conversations/${convId}/messages`),
  startConversation: (body) => request('POST', '/conversations', body),
  sendMessage: (convId, text) => request('POST', `/conversations/${convId}/messages`, { text }),
  generateOtp: (conversationId) => request('POST', '/otps/generate', { conversation_id: conversationId }),
  verifyOtp: (conversationId, otp) => request('POST', '/otps/verify', { conversation_id: conversationId, otp }),

  // Users
  getUser: (id) => request('GET', `/users/${id}`, null, false),
  reviewUser: (id, body) => request('POST', `/users/${id}/review`, body),

  // Startups
  getStartups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/startups${q ? '?' + q : ''}`, null, false);
  },
  getMyStartups: () => request('GET', '/startups/mine'),
  getStartup: (id) => request('GET', `/startups/${id}`, null, false).then((data) => ({
    ...data,
    products: Array.isArray(data.products) ? data.products.map(normalizeListing) : [],
  })),
  createStartup: (body) => request('POST', '/startups', body),
  upvoteStartup: (id) => request('POST', `/startups/${id}/upvote`),
};
