import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuMonitor, LuPrinter, LuShieldCheck, LuCalendar, LuArrowRight, LuChevronDown } from 'react-icons/lu';
import localProducts from '../data/products';
import ProductCard from '../components/ProductCard';
import { enrichProductsWithImages, getProductImageUrl } from '../utils/productImages';
import { normalizeProductList } from '../utils/normalizeProduct';
import { getProducts } from '../services/productService';
import { getAds } from '../services/adService';
import { LuX } from 'react-icons/lu';
import SEO from '../components/SEO';
import './Home.css';

function Home() {
  const services = [
    { 
      title: 'Computer and Accessories', 
      desc: 'High-performance computers and essential peripherals for your workspace.',
      icon: <LuMonitor />
    },
    { 
      title: 'Printer and Copy Machine', 
      desc: 'Reliable printing and copying solutions for every business scale.',
      icon: <LuPrinter />
    },
    { 
      title: 'Security Cameras', 
      desc: 'Advanced surveillance systems to keep your property safe and secure.',
      icon: <LuShieldCheck />
    },
    { 
      title: 'Special event Organizer', 
      desc: 'We organize events that leave a lasting impression.',
      icon: <LuCalendar />
    },
  ];

  const [featured, setFeatured] = useState(() =>
    enrichProductsWithImages(localProducts.slice(0, 4))
  );
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => {
    // Fetch products
    getProducts({ limit: 4 })
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          let norms = enrichProductsWithImages(normalizeProductList(list).slice(0, 4));
          norms = norms.map(norm => {
            if (!norm.imageUrl || norm.imageUrl.trim() === '') {
              const fallback = localProducts.find(p => String(p.id) === String(norm.id));
              if (fallback && fallback.image) {
                // Manually apply fallback image
                norm.imageUrl = getProductImageUrl(fallback.image) || fallback.image;
              }
            }
            return norm;
          });
          setFeatured(norms);
        }
      })
      .catch(() => {/* keep local fallback */ });

    // Fetch Ads
    getAds()
      .then((res) => {
        setAds(res.data);
      })
      .catch((err) => console.error('Failed to load ads', err));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0, filter: 'blur(10px)' },
    visible: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
      }
    }
  };

  const sidebarAds = ads.filter(ad => ad.placement !== 'banner');
  const bannerAds = ads.filter(ad => ad.placement === 'banner');

  return (
    <div className="home-page">
      <SEO 
        title="Home" 
        description="Connecting Ethiopian markets with quality international products for over 5 years. Shop electronics, fashion, and general merchandise."
      />
      <div className="home-layout-container">
        <div className="home-main-content">
          {/* Top Premium Banner Ads */}
          {bannerAds && bannerAds.length > 0 && (
            <TopBannerAds ads={bannerAds} onClick={(ad) => setSelectedAd(ad)} />
          )}

          {/* Hero Section */}
          <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-title">
            Your Trusted Partner in <span>General Trading</span>
          </h1>
          <p className="hero-subtitle">
            Connecting Ethiopian markets with quality international products for over 5 years.
          </p>
          <div className="hero-buttons">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="btn-primary">
                <span>Explore Products</span>
                <LuArrowRight className="arrow-icon" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/contact" className="btn-outline">
                Contact Us
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Comprehensive solutions for your business needs</p>
          </div>
        </motion.div>

        <motion.div 
          className="services-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div 
              key={index} 
              className="service-card"
              variants={itemVariants}
              whileHover="hovered"
              initial="visible"
            >
              <div className="service-card-header">
                <div className="service-icon">
                  {service.icon}
                </div>
                <div className="service-title-wrapper">
                  <h3>{service.title}</h3>
                  <p className="service-info-hint">Check details</p>
                </div>
                <motion.div
                  className="service-expand-indicator"
                  variants={{
                    hovered: { rotate: 180 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <LuChevronDown size={20} />
                </motion.div>
              </div>
              
              <motion.div
                className="service-card-description"
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                variants={{
                  hovered: { 
                    height: 'auto', 
                    opacity: 1, 
                    marginTop: '0.75rem',
                    transition: { duration: 0.3, ease: 'easeOut' }
                  }
                }}
                style={{ overflow: 'hidden' }}
              >
                <p>{service.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Top quality products available now</p>
          </div>
          <Link to="/products" className="section-link">
            <span>View All</span>
            <LuArrowRight className="arrow-icon" />
          </Link>
        </motion.div>

        <motion.div 
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
        >
          {featured.map((product) => (
            <motion.div key={product.id || product._id || product.name} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>

        </div>

        {/* Vertical Ads Sidebar */}
        {sidebarAds && sidebarAds.length > 0 && (
          <aside className="home-sidebar-ads">
            <h3 className="sidebar-ads-title">Sponsored Partners</h3>
            <div className="sidebar-ads-list">
              {sidebarAds.map((ad) => (
                <SidebarAdItem key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Ad Detail Modal — rendered via Portal to escape stacking context */}
      {selectedAd && createPortal(
        <div className="ad-modal-overlay" onClick={() => setSelectedAd(null)} style={{ zIndex: 9999 }}>
          <motion.div 
            className="ad-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="ad-modal-close" onClick={() => setSelectedAd(null)}>
              <LuX size={24} />
            </button>
            <div className="ad-modal-body">
              <div className="ad-modal-image">
                <img
                  src={selectedAd.image}
                  alt={selectedAd.companyName}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="ad-modal-text">
                <h2>{selectedAd.companyName}</h2>
                {selectedAd.description && (
                  <div className="ad-modal-detail">
                    <label>About</label>
                    <p>{selectedAd.description}</p>
                  </div>
                )}
                <div className="ad-modal-detail">
                  <label>Location / Address</label>
                  <p>{selectedAd.address}</p>
                </div>
                {selectedAd.phone && (
                  <div className="ad-modal-detail">
                    <label>Phone</label>
                    <p>
                      <a href={`tel:${selectedAd.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {selectedAd.phone}
                      </a>
                    </p>
                  </div>
                )}
                {selectedAd.email && (
                  <div className="ad-modal-detail">
                    <label>Email</label>
                    <p>
                      <a href={`mailto:${selectedAd.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {selectedAd.email}
                      </a>
                    </p>
                  </div>
                )}
                {selectedAd.website && (
                  <div className="ad-modal-detail">
                    <label>Website</label>
                    <p>
                      <a
                        href={selectedAd.website.startsWith('http') ? selectedAd.website : `https://${selectedAd.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}
                      >
                        {selectedAd.website}
                      </a>
                    </p>
                  </div>
                )}
                <button
                  className="btn-primary"
                  onClick={() => setSelectedAd(null)}
                  style={{ width: '100%', marginTop: 'auto', cursor: 'pointer', border: 'none' }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Stats Section */}
      <section className="stats-section-container">
        <motion.div 
          className="stats-section"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Years Experience</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Happy Clients</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

const SidebarAdItem = ({ ad, onClick }) => {
  const slideImages = Array.isArray(ad.slideImages) ? ad.slideImages : (typeof ad.slideImages === 'string' ? JSON.parse(ad.slideImages || '[]') : []);
  const allImages = [ad.image, ...slideImages].filter(Boolean);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (allImages.length <= 1 || !ad.slideInterval || ad.slideInterval <= 0) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % allImages.length);
    }, ad.slideInterval * 1000);
    return () => clearInterval(timer);
  }, [allImages.length, ad.slideInterval]);

  return (
    <motion.div 
      className="sidebar-ad-card"
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      onClick={onClick}
    >
      <div className="sidebar-ad-header">
        <h4 className="sidebar-ad-company">{ad.companyName}</h4>
        <span className="sidebar-ad-tag">Ad</span>
      </div>
      <div className="sidebar-ad-image">
        <img
          key={allImages[currentIdx]}
          src={allImages[currentIdx]}
          alt={ad.companyName}
          style={{ transition: 'opacity 0.5s ease' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.style.background = 'var(--bg-card)';
          }}
        />
      </div>
      {ad.description && (
        <div className="sidebar-ad-footer">
          <p className="sidebar-ad-services">{ad.description}</p>
        </div>
      )}
    </motion.div>
  );
};

const TopBannerAds = ({ ads, onClick }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ads.length);
    }, 8000); // cycle banners every 8 seconds
    return () => clearInterval(timer);
  }, [ads.length]);

  const activeAd = ads[currentIdx];
  if (!activeAd) return null;

  return (
    <motion.div 
      className="top-banner-ad-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => onClick(activeAd)}
    >
      <div className="top-banner-ad-inner">
        <span className="top-banner-badge">Sponsor</span>
        <img 
          key={activeAd.image}
          src={activeAd.image} 
          alt={activeAd.companyName} 
          className="top-banner-ad-image"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
    </motion.div>
  );
};

export default Home;