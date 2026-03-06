import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
// const API_URL = "http://localhost:5000";
const API_URL = "https://trespics-school.onrender.com";
const api = axios.create({
  baseURL: `${API_URL}/api`, // Uses local in dev, Render in production
});

// Add a request interceptor to attach the token
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

export default api;
