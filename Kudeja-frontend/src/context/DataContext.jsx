import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', joinDate: '2024-01-20' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'Inactive', joinDate: '2024-01-25' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Active', joinDate: '2024-02-01' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'Suspended', joinDate: '2024-02-05' },
  ]);

  const [stats, setStats] = useState({
    totalUsers: 1245,
    activeUsers: 890,
    revenue: 12450,
    growth: 12.5,
    orders: 567,
    pendingOrders: 23,
    completedOrders: 544
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('kudeja_admin_settings');
    return saved ? JSON.parse(saved) : {
      siteTitle: 'Kudeja Admin',
      siteDescription: 'Kudeja Administration Panel',
      maintenanceMode: false,
      userRegistration: true,
      emailNotifications: true,
      darkMode: false,
      itemsPerPage: 25,
      timezone: 'UTC'
    };
  });

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New user registered', time: '10 min ago', type: 'info' },
    { id: 2, message: 'Order #1234 completed', time: '30 min ago', type: 'success' },
    { id: 3, message: 'Server maintenance scheduled', time: '1 hour ago', type: 'warning' }
  ]);

  const addUser = (userData) => {
    const newUser = {
      id: users.length + 1,
      ...userData,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, newUser]);
    return { success: true, data: newUser };
  };

  const updateUser = (id, userData) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    return { success: true };
  };

  const deleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
    return { success: true };
  };

  const refreshStats = () => {
    setStats({
      totalUsers: Math.floor(Math.random() * 2000) + 1000,
      activeUsers: Math.floor(Math.random() * 1500) + 500,
      revenue: Math.floor(Math.random() * 20000) + 10000,
      growth: Math.floor(Math.random() * 30) + 5,
      orders: Math.floor(Math.random() * 1000) + 500,
      pendingOrders: Math.floor(Math.random() * 50),
      completedOrders: Math.floor(Math.random() * 1000) + 500
    });
  };

  const updateSettingsData = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('kudeja_admin_settings', JSON.stringify(updated));
    return { success: true };
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: notifications.length + 1,
      ...notification,
      time: 'Just now'
    };
    setNotifications([newNotification, ...notifications]);
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    users,
    stats,
    settings,
    notifications,
    addUser,
    updateUser,
    deleteUser,
    refreshStats,
    updateSettingsData,
    addNotification,
    removeNotification,
    clearNotifications
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};