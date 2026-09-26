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
  const response = await apiClient.post('/skill-assessment/submit', { answers: answersMap });
  return response.data;
};

export const getAssessmentResult = async () => {
  const response = await apiClient.get('/skill-assessment/me');
  return response.data;
};


// --- PHASE 5 PERSONALIZED RECOMMENDATION APIS ---
export const getRecommendations = async (category = 'all') => {
  const params = {};
  if (category && category !== 'all') params.category = category;
  const response = await apiClient.get('/recommendations', { params });
  return response.data;
};

export const getPersonalizedCareerDetail = async (careerId) => {
  const response = await apiClient.get(`/recommendations/${careerId}`);
  return response.data;
};

// --- PHASE 6 CAREER ACTION PLAN APIS ---
export const getActionPlan = async () => {
  const response = await apiClient.get('/action-plan');
  return response.data;
};

export const getSkillGaps = async () => {
  const response = await apiClient.get('/action-plan/skill-gaps');
  return response.data;
};

export const getRoadmap = async () => {
  const response = await apiClient.get('/action-plan/roadmap');
  return response.data;
};

export const getRoadmapProjects = async () => {
  const response = await apiClient.get('/action-plan/projects');
  return response.data;
};

export const getJobReadiness = async () => {
  const response = await apiClient.get('/action-plan/readiness');
  return response.data;
};

export const updateActionPlanProgress = async (itemId, itemType = 'skill', status = 'Completed') => {
  const response = await apiClient.patch('/action-plan/progress', {
    item_id: itemId,
    item_type: itemType,
    status: status
  });
  return response.data;
};

export const regenerateActionPlan = async (targetCareerId = null) => {
  const payload = targetCareerId ? { target_career_id: targetCareerId } : {};
  const response = await apiClient.post('/action-plan/regenerate', payload);
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

// --- PHASE 7 JOB RECOMMENDATION & APPLICATION TRACKING APIS ---
export const getRecommendedJobs = async (params = {}) => {
  const response = await apiClient.get('/jobs/recommended', { params });
  return response.data;
};

export const getJobs = async (params = {}) => {
  const response = await apiClient.get('/jobs', { params });
  return response.data;
};

export const getJobDetail = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}`);
  return response.data;
};

export const getJobMatch = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}/match`);
  return response.data;
};

export const saveJob = async (jobId) => {
  const response = await apiClient.post(`/jobs/${jobId}/save`);
  return response.data;
};

export const unsaveJob = async (jobId) => {
  const response = await apiClient.delete(`/jobs/${jobId}/save`);
  return response.data;
};

export const getSavedJobs = async () => {
  const response = await apiClient.get('/jobs/saved');
  return response.data;
};

export const createApplication = async (data) => {
  const response = await apiClient.post('/applications', data);
  return response.data;
};

export const getApplications = async () => {
  const response = await apiClient.get('/applications');
  return response.data;
};

export const getApplication = async (applicationId) => {
  const response = await apiClient.get(`/applications/${applicationId}`);
  return response.data;
};

export const updateApplication = async (applicationId, data) => {
  const response = await apiClient.patch(`/applications/${applicationId}`, data);
  return response.data;
};

export const deleteApplication = async (applicationId) => {
  const response = await apiClient.delete(`/applications/${applicationId}`);
  return response.data;
};

export const getApplicationStats = async () => {
  const response = await apiClient.get('/applications/stats');
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
  const params = {};
  if (category && category !== 'all') params.category = category;
  const response = await apiClient.get('/projects', { params });
  return response.data;
};

// --- PHASE 8 PORTFOLIO PROJECTS & TRACKING APIS ---
export const getRecommendedProjects = async (category = 'all') => {
  const params = {};
  if (category && category !== 'all') params.category = category;
  const response = await apiClient.get('/projects/recommended', { params });
  return response.data;
};

export const getProjectDetail = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
};

export const getProjectProgress = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/progress`);
  return response.data;
};

export const updateProjectProgress = async (projectId, statusOrPayload, progressPercentage = null) => {
  let payload = {};
  if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
    payload = statusOrPayload;
  } else {
    if (statusOrPayload) payload.status = statusOrPayload;
    if (progressPercentage !== null && progressPercentage !== undefined) {
      payload.progress_percentage = parseInt(progressPercentage, 10);
    }
  }
  const response = await apiClient.patch(`/projects/${projectId}/progress`, payload);
  return response.data;
};

export const toggleProjectMilestone = async (projectId, milestoneId) => {
  const response = await apiClient.patch(`/projects/${projectId}/milestones/${milestoneId}`);
  return response.data;
};

export const startProject = async (projectId) => {
  const response = await apiClient.post(`/projects/${projectId}/start`);
  return response.data;
};

export const completeProject = async (projectId) => {
  const response = await apiClient.post(`/projects/${projectId}/complete`);
  return response.data;
};

// --- PHASE 9 AI CAREER ASSISTANT & INTERVIEW PREPARATION APIS ---
export const getAssistantContext = async () => {
  const response = await apiClient.get('/assistant/context');
  return response.data;
};

export const sendAssistantMessage = async (message) => {
  const response = await apiClient.post('/assistant/chat', { message });
  return response.data;
};

export const getAssistantHistory = async () => {
  const response = await apiClient.get('/assistant/history');
  return response.data;
};

export const clearAssistantHistory = async () => {
  const response = await apiClient.delete('/assistant/history');
  return response.data;
};

export const startInterviewSession = async (payload) => {
  const response = await apiClient.post('/interview/start', payload);
  return response.data;
};

export const submitInterviewAnswer = async (sessionId, answer) => {
  const response = await apiClient.post(`/interview/${sessionId}/answer`, { answer });
  return response.data;
};

export const getInterviewSession = async (sessionId) => {
  const response = await apiClient.get(`/interview/${sessionId}`);
  return response.data;
};

export const getInterviewHistory = async () => {
  const response = await apiClient.get('/interview/history');
  return response.data;
};

export const clearInterviewHistory = async () => {
  const response = await apiClient.delete('/interview/history');
  return response.data;
};

export const finishInterviewSession = async (sessionId) => {
  const response = await apiClient.post(`/interview/${sessionId}/finish`);
  return response.data;
};

export default apiClient;

