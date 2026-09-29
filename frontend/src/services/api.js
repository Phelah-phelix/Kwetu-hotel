import axios from 'axios';

// One shared axios instance for the whole app, pointed at our backend.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Before every request, if we have a JWT saved from login, attach it as
// "Authorization: Bearer <token>" — this is what lets protected routes
// (bookings, dashboards) know who's calling.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kwetu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
