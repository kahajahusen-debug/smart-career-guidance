import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for handling auth expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on Unauthorized response
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION APIS ---
export const signupUser = async (data) => {
  const response = await apiClient.post('/auth/signup', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// --- PROFILE APIS ---
export const saveProfile = async (data) => {
  const response = await apiClient.post('/profile', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/profile/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await apiClient.put('/profile/me', data);
  return response.data;
};

// --- ASSESSMENT & RECOMMENDATION APIS ---
export const submitAssessment = async (answersMap) => {
  const response = await apiClient.post('/assessment/submit', { answers: answersMap });
  return response.data;
};

export const getAssessmentResult = async () => {
  const response = await apiClient.get('/assessment/me');
  return response.data;
};

// --- PHASE 4 ADVANCED SKILL ASSESSMENT APIS ---
export const fetchSkillAssessmentQuestions = async (category = 'all', difficulty = null, skillCategory = null) => {
  const params = {};
  if (category && category !== 'all') params.category = category;
  if (difficulty) params.difficulty = difficulty;
  if (skillCategory) params.skill_category = skillCategory;
  const response = await apiClient.get('/skill-assessment/questions', { params });
  return response.data;
};

export const submitSkillAssessment = async (answersMap) => {
  const response = await apiClient.post('/skill-assessment/submit', { answers: answersMap });
  return response.data;
};

export const getSkillAssessmentResult = async () => {
  const response = await apiClient.get('/skill-assessment/me');
  return response.data;
};

// --- PHASE 3 CAREER DISCOVERY APIS ---
export const fetchDiscoveryQuestions = async () => {
  const response = await apiClient.get('/discovery/questions');
  return response.data;
};

export const submitDiscoveryAnswers = async (answersMap) => {
  const response = await apiClient.post('/discovery/submit', { answers: answersMap });
  return response.data;
};

export const getDiscoveryResult = async () => {
  const response = await apiClient.get('/discovery/me');
  return response.data;
};

// --- PHASE 1 EXISTING APIS (PRESERVED) ---
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchCareers = async (category = 'all') => {
  const response = await apiClient.get('/careers', { params: { category } });
  return response.data;
};

export const fetchCareerById = async (id) => {
  const response = await apiClient.get(`/careers/${id}`);
  return response.data;
};

export const fetchQuestions = async (category = 'all', difficulty = null) => {
  const response = await apiClient.get('/questions', { params: { category, difficulty } });
  return response.data;
};

export const fetchSampleJobs = async (category = 'all') => {
  const response = await apiClient.get('/jobs', { params: { category } });
  return response.data;
};

export const fetchPortfolioProjects = async (category = 'all') => {
  const response = await apiClient.get('/projects', { params: { category } });
  return response.data;
};

export default apiClient;
