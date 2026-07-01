import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, User, Package, Home, Phone, Info } from 'lucide-react';

function UserLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="shadow-md sticky top-0 z-50 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-navbar)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/src/images/kudeja logo.png" 
                alt="Kudeja Logo" 
                className="h-24 w-auto object-contain transition-all nav-logo-img"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 transition" style={{ color: 'var(--text-muted)' }}>
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/products" className="flex items-center space-x-2 transition" style={{ color: 'var(--text-muted)' }}>
                <Package size={18} />
                <span>Products</span>
              </Link>
              <Link to="/about" className="flex items-center space-x-2 transition" style={{ color: 'var(--text-muted)' }}>
                <Info size={18} />
                <span>About</span>
              </Link>
              <Link to="/contact" className="flex items-center space-x-2 transition" style={{ color: 'var(--text-muted)' }}>
                <Phone size={18} />
                <span>Contact</span>
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-6">
              <Link to="/cart" className="relative">
                <ShoppingCart size={24} style={{ color: 'var(--text-main)' }} className="hover:text-green-600 transition" />
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>
              <Link to="/profile" className="bg-gray-100 p-2 rounded-full">
                <User size={20} className="text-gray-700" />
              </Link>
              <Link to="/login" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/src/images/kudeja logo.png" 
                  alt="Kudeja Logo" 
                  className="h-24 w-auto object-contain brightness-0 invert footer-logo-img"
                />
              </div>
              <p className="text-gray-400">Your trusted partner in quality products and logistics solutions.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-gray-400 hover:text-white transition">Products</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Product Sourcing</li>
                <li className="text-gray-400">Logistics</li>
                <li className="text-gray-400">Business Consulting</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>contact@kudeja.et</li>
                <li>+251 123 456 789</li>
                <li>Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kudeja General Trading. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default UserLayout;