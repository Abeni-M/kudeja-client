import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMessages } from '../context/MessageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LuShoppingCart, LuUser, LuLogOut, LuChevronDown, LuSearch, LuPackage, LuMail } from 'react-icons/lu';
import './UserNavbar.css';

const UserNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="user-navbar">
      <div className="user-navbar-container">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/" className="user-navbar-logo">
            <img 
              src="/src/images/kudeja logo.png" 
              alt="Kudeja Logo" 
              className="navbar-logo-img" 
            />
          </Link>
        </motion.div>

        {/* Search Bar */}
        <div className="user-navbar-search-wrapper">
          <form onSubmit={handleSearch} className="user-navbar-search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-navbar-search-input"
            />
            <button type="submit" className="user-navbar-search-button">
              <LuSearch />
            </button>
          </form>
        </div>

        {/* Navigation Links */}
        <div className="user-navbar-links">
          <Link to="/products" className="user-navbar-link">
            Products
          </Link>

          <Link to="/cart" className="user-navbar-cart">
            <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LuShoppingCart size={20} />
              <span>Cart</span>
            </motion.div>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="badge"
              >
                {cartCount}
              </motion.span>
            )}
          </Link>

          {isAuthenticated() ? (
            <div className="user-menu-wrapper">
              <motion.button
                whileHover={{ backgroundColor: '#f5f5f5' }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="user-menu-button"
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span>{user?.name || 'User'}</span>
                <motion.span animate={{ rotate: isMenuOpen ? 180 : 0 }}>
                  <LuChevronDown size={16} />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="user-dropdown"
                  >
                    <div className="dropdown-header">
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>

                    <div className="dropdown-content">
                      <Link to="/profile" className="dropdown-item">
                        <LuUser size={16} style={{ marginRight: '10px' }} />
                        <span>My Profile</span>
                      </Link>
                      <Link to="/orders" className="dropdown-item">
                        <LuPackage size={16} style={{ marginRight: '10px' }} />
                        <span>My Orders</span>
                      </Link>
                      <Link to="/my-messages" className="dropdown-item dropdown-item-flex">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <LuMail size={16} style={{ marginRight: '10px' }} />
                          <span>My Messages</span>
                        </div>
                        {unreadCount > 0 && (
                          <motion.span 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="unread-badge"
                          >
                            {unreadCount}
                          </motion.span>
                        )}
                      </Link>
                    </div>

                    <div className="dropdown-footer" style={{ borderTop: '1px solid #eee' }}>
                      <button onClick={handleLogout} className="logout-button">
                        <LuLogOut size={16} style={{ marginRight: '10px' }} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="register-btn">Register</Link>
            </div>
          )}

          {isStaff && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;