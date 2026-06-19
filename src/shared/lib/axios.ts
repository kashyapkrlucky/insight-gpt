import axios from "axios";

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000") + "/api",
});


// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh or errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear local storage
      localStorage.removeItem("token");
      // Optionally redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;