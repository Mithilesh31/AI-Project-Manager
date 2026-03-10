import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5003/api",
  headers: { "Content-Type": "application/json" },
});

// Projects
export const getProjects = () => api.get("/projects/");
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects/", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Tasks
export const getTasks = (params) => api.get("/tasks/", { params });
export const createTask = (data) => api.post("/tasks/", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// AI
export const summarizeTask = (id) => api.post(`/ai/summarize/${id}`);
export const suggestTasks = (project_id) =>
  api.post("/ai/suggest-tasks", { project_id });
export const prioritizeTasks = (project_id) =>
  api.post("/ai/prioritize", { project_id });
export const getProjectSummary = (id) => api.get(`/ai/project-summary/${id}`);
