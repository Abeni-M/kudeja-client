import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { DataProvider } from './context/DataContext';
import { MessageProvider } from './context/MessageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import MyMessages from './pages/MyMessages';
import Cart from './pages/Cart';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import PrivateRoute from './components/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './Layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMessages from './pages/admin/Messages';
import AdminSettings from './pages/admin/AdminSettings';
import ManageAds from './pages/admin/ManageAds';
import LiveChatWidget from './components/LiveChatWidget';

import { useData } from './context/DataContext';

const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
    <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#667eea' }}>404</h1>
    <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '1.5rem' }}>Page not found.</p>
    <a href="/" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'underline' }}>Go home</a>
  </div>
);

const MaintenanceBanner = () => {
  const { settings } = useData();
  if (!settings?.maintenanceMode) return null;
  return (
    <div style={{
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '8px 20px',
      textAlign: 'center',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      🚧 SITE IN MAINTENANCE MODE — Only administrators can see the live storefront correctly.
    </div>
  );
};

const AppContent = () => {
  const { settings } = useData();
  
  useEffect(() => {
    document.title = settings?.siteTitle || 'Kudeja Trading PLC';
  }, [settings?.siteTitle]);

  return (
    <BrowserRouter>
      <MaintenanceBanner />
      <Navbar />
      <main style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-messages"
            element={
              <PrivateRoute>
                <MyMessages />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />

          <Route path="/admin" element={<ProtectedRoute requireAdmin={true} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="ads" element={<ManageAds />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <LiveChatWidget />
      <Footer />
    </BrowserRouter>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MessageProvider>
          <ThemeProvider>
            <CartProvider>
              <DataProvider>
                <AppContent />
              </DataProvider>
            </CartProvider>
          </ThemeProvider>
        </MessageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;