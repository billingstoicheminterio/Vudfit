import axios from 'axios';

const getBaseURL = () => {
  // If a VITE_API_URL environment variable is provided, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const { hostname, protocol } = window.location;
  // If running locally, connect to backend on localhost:8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  // If accessing via LAN IP (e.g. 192.168.x.x), connect to the same host on port 8000
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipPattern.test(hostname)) {
    return `http://${hostname}:8000/api`;
  }
  // Production URL resolving. If frontend is hosted, backend is subdomained as api.yourdomain
  const backendProtocol = protocol === 'https:' ? 'https:' : 'http:';
  // Alternatively, if hosted under same domain reverse-proxied, use `/api`
  return `${backendProtocol}//${hostname}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout for low internet speeds
});

// Request interceptor to add Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry (401 unauthorized) and auto-retry on low-speed network failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response && response.status === 401) {
      // Clear credentials and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Network timeout or connection drop retry (up to 2 retries for slow mobile internet)
    if (config && !config._retry && (!response || error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= 2) {
        // Wait 1.5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
