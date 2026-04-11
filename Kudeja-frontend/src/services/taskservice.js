const API_URL = 'http://localhost:5000/api/tasks'; // adjust the port if needed

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const taskService = {
  async getTasks() {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  async getTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    return response.json();
  },

  async createTask(taskData) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  async updateTask(id, taskData) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  async deleteTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    return response.json();
  },
};

export default taskService;