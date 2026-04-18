import React from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <SEO 
        title="About Us" 
        description="Learn more about Kudeja Trading, your reliable partner in Ethiopia for electronics, computers, and general trading since 20XX."
      />
      <div className="container">
        <h1 className="page-title">About Kudeja Trading</h1>
        <div className="about-content">
          <div className="about-text">
            <p>
              Founded in 20**, Kudeja Trading has grown to become a trusted partner for businesses 
              across Ethiopia and beyond. We specialize in general trading, connecting local markets 
              with high-quality international products.
            </p>
            <p>
              Our team brings decades of combined experience in desktop, Printers, 
              and accessories of computer. We pride ourselves on our integrity, reliability, and commitment 
              to customer satisfaction.
            </p>
            <p>
              Whether you need Security camera, electronics,  laptop or desktop computer, or 
              business consulting, Kudeja Trading is your one-stop solution.
            </p>
          </div>
          <div className="about-stats">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;