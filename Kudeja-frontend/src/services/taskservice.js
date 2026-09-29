import api from './api';

const taskService = {
  async getTasks() {
    const res = await api.get('/tasks');
    return res.data;
  },

  async getTask(id) {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  async createTask(taskData) {
    const res = await api.post('/tasks', taskData);
    return res.data;
  },

  async updateTask(id, taskData) {
    const res = await api.put(`/tasks/${id}`, taskData);
    return res.data;
  },

  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
};

export default taskService;