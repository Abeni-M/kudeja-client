import React from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import './About.css';

const About = () => {
  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <SEO 
        title="About Us" 
        description="Learn more about Kudeja Trading, your reliable partner in Ethiopia for electronics, computers, and general trading."
      />
      <div className="container">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          About Kudeja Trading
        </motion.h1>
        <div className="about-content">
          <motion.div 
            className="about-text reveal-left delay-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p>
              Founded with a vision for excellence, Kudeja Trading has grown to become a trusted partner for businesses 
              across Ethiopia and beyond. We specialize in general trading, connecting local markets 
              with high-quality international products.
            </p>
            <p>
              Our team brings decades of combined experience in desktop computers, printers, security equipment, 
              and accessories. We pride ourselves on our integrity, reliability, and commitment 
              to customer satisfaction.
            </p>
            <p>
              Whether you need security cameras, office electronics, laptops, desktop computers, or 
              business consulting, Kudeja Trading is your one-stop solution.
            </p>
          </motion.div>
          
          <motion.div 
            className="about-stats reveal-right delay-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div>Years of Excellence</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div>Clients Served</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div>Product Categories</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;