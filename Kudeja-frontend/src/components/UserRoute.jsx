import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function UserRoute() {
  // TEMPORARY: Replace with real auth check later
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <Outlet />;
}

export default UserRoute;