import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTelegram, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-column">
          <div className="footer-logo">
            <img
              src="/src/images/kudeja logo.png"
              alt="Kudeja Trading PLC"
              className="footer-logo-img"
            />
          </div>
          <p className="footer-text">
            Your trusted partner in quality products, logistics, and trading solutions across Ethiopia and beyond.
          </p>
          <div className="footer-social-icons">
            <a href="https://t.me/only_by_jesus" target="_blank" rel="noopener noreferrer" className="social-icon telegram" title="Join our Telegram Channel">
              <FaTelegram size={20} />
            </a>
            <a href="https://wa.me/251911430926" target="_blank" rel="noopener noreferrer" className="social-icon whatsapp" title="Chat on WhatsApp">
              <FaWhatsapp size={20} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon facebook" title="Follow us on Facebook">
              <FaFacebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon instagram" title="Follow us on Instagram">
              <FaInstagram size={20} />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-icon tiktok" title="Follow us on TikTok">
              <FaTiktok size={20} />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">Contact</h3>
          <ul className="footer-contact">
            <li>E-mail: tojiska@gmail.com</li>
            <li>Website: www.kudeja.et</li>
            <li>Mobile: +251 911 430 926</li>
            <li>Tel: +251 115 586 557</li>
            <li>P.O.Box: 1516/1250 </li>
            <li>Address: Bole Road, Dembel city center </li>
            <li> Addis Ababa, Ethiopia</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Kudeja Trading PLC. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;