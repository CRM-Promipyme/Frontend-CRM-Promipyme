import axios from "axios";
import { useAuthStore } from "../stores/authStore";

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;
console.log("API Base URL:", API_BASE_URL);

// Create an Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Function to retrieve the token (from localStorage, Redux, or Context)
const getAuthToken = (): string | null => {
    const accessToken = useAuthStore.getState().accessToken;
    return accessToken;
};

// Add a request interceptor to attach the token to every request
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
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
