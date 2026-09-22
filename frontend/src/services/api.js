import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

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
