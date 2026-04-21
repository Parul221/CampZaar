const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api'; // priyal

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
    return request('GET', `/listings${q ? '?' + q : ''}`, null, false);
  },
  getListing: (id) => request('GET', `/listings/${id}`, null, false),
  createListing: (body) => request('POST', '/listings', body),
  updateListing: (id, body) => request('PUT', `/listings/${id}`, body),
  deleteListing: (id) => request('DELETE', `/listings/${id}`),
  likeListing: (id) => request('POST', `/listings/${id}/like`),
  getUserListings: (userId) => request('GET', `/listings/user/${userId}`, null, false),

  // Conversations
  getConversations: () => request('GET', '/conversations'),
  getMessages: (convId) => request('GET', `/conversations/${convId}/messages`),
  startConversation: (body) => request('POST', '/conversations', body),
  sendMessage: (convId, text) => request('POST', `/conversations/${convId}/messages`, { text }),

  // Users
  getUser: (id) => request('GET', `/users/${id}`, null, false),
  reviewUser: (id, body) => request('POST', `/users/${id}/review`, body),

  // Startups
  //getStartups: (params = {}) => {
    //const q = new URLSearchParams(params).toString();
  //  return request('GET', `/startups${q ? '?' + q : ''}`, null, false);
 // },
 // createStartup: (body) => request('POST', '/startups', body),
 // upvoteStartup: (id) => request('POST', `/startups/${id}/upvote`),
};