import axios from 'axios';
import { getToken, clearAuth } from '@/lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Auth ---
export const authApi = {
  register: (data: { email: string; password: string; role: 'CANDIDATE' | 'EMPLOYER' }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// --- Candidate Profile ---
export const candidateApi = {
  getProfile: () => api.get('/candidates/me'),
  updateProfile: (data: unknown) => api.patch('/candidates/me', data),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/candidates/me/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// --- O*NET ---
export const onetApi = {
  listAll: (page = 1, pageSize = 20) =>
    api.get('/onet/occupations', { params: { start: (page - 1) * pageSize + 1, end: page * pageSize } }),
  searchOccupations: (keyword: string, page = 1) =>
    api.get('/onet/occupations/search', { params: { keyword, start: (page - 1) * 20 + 1, end: page * 20 } }),
  getOccupation: (code: string) => api.get(`/onet/occupations/${code}`),
  browseByIndustry: (industryCode: string, page = 1) =>
    api.get(`/onet/occupations/industry/${encodeURIComponent(industryCode)}`, { params: { start: (page - 1) * 20 + 1, end: page * 20 } }),
  getIndustries: () => api.get('/onet/industries'),
};

// --- Gap Analysis ---
export const gapApi = {
  analyze: (occupationCode: string) =>
    api.post('/gap-analysis', null, { params: { occupationCode } }),
  getHistory: () =>
    api.get('/gap-analysis/history'),
};

// --- Employer ---
export const employerApi = {
  getProfile: () => api.get('/employers/me'),
  updateProfile: (data: unknown) => api.patch('/employers/me', data),
  searchCandidates: (params: {
    occupationCode?: string;
    minMatchScore?: number;
    skills?: string[];
    page?: number;
  }) => api.get('/employers/candidates/search', { params }),
};
