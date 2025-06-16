import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getGoogleAuthUrl: () => api.get('/auth/google'),
  googleCallback: (code: string) => api.post('/auth/google/callback', { code }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// Gmail API
export const gmailAPI = {
  getUnsubscribeEmails: (params?: {
    page?: number;
    limit?: number;
    sender?: string;
    pageToken?: string;
  }) => api.get('/gmail/unsubscribe-emails', { params }),
  getStats: () => api.get('/gmail/stats'),
  markUnsubscribed: (emailId: string, unsubscribeUrl: string) =>
    api.post('/gmail/mark-unsubscribed', { emailId, unsubscribeUrl })
};

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface UnsubscribeLink {
  source: 'header' | 'body';
  url: string;
}

export interface UnsubscribeEmail {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  date: string;
  unsubscribeLinks: UnsubscribeLink[];
  snippet: string;
}

export interface EmailStats {
  totalInboxEmails: number;
  unsubscribeEmailsCount: number;
  lastUpdated: string;
}

export interface UnsubscribeEmailsResponse {
  emails: UnsubscribeEmail[];
  totalCount: number;
  nextPageToken?: string;
}

export default api;
