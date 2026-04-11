import React, { useState } from 'react';
import { getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import localProducts from '../data/products';
import { enrichProductsWithImages } from '../utils/productImages';
import { normalizeProductList } from '../utils/normalizeProduct';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LuSearch, LuFilter, LuArrowUpDown } from 'react-icons/lu';
import './Products.css';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await getProducts({ limit: 1000 });
        const data = res?.data;
        let list = Array.isArray(data) ? data : (data?.data || data?.products || []);
        
        if (list.length === 0) list = localProducts;
        
        let norms = enrichProductsWithImages(normalizeProductList(list));
        norms = norms.map(norm => {
          if (!norm.imageUrl || norm.imageUrl.trim() === '') {
            const fallback = localProducts.find(p => String(p.id) === String(norm.id));
            if (fallback && fallback.image) {
              norm.imageUrl = normalizeProductList([fallback])[0].imageUrl || fallback.image;
            }
          }
          return norm;
        });
        return norms;
      } catch (err) {
        console.error('API Error, using fallback:', err);
        return enrichProductsWithImages(normalizeProductList(localProducts));
      }
    }
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !search.trim() || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.priceNumber ?? 0) - (b.priceNumber ?? 0);
    if (sortBy === 'price-desc') return (b.priceNumber ?? 0) - (a.priceNumber ?? 0);
    return 0;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <section className="products-page">
        <div className="container">
          <div className="products-state">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section className="products-page">
        <div className="container">
          <div className="products-state products-state--error">{error}</div>
        </div>
      </section>
    );
  }

  // Filter and Sort logic moved inside components for reactive updates with useQuery

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="products-page"
    >
      <div className="container">
        <header className="products-header">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="page-title">Our Products</h1>
            <p className="page-subtitle">
              Explore our curated selection of high-quality products for your business.
            </p>
          </motion.div>

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="products-search-wrapper">
            <LuSearch className="search-icon-abs" />
            <input
              type="search"
              className="products-search-input"
              placeholder="Search products, brands or categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </motion.div>

          <div className="products-controls">
            <div className="filter-bar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-btn${selectedCategory === cat ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="sort-select-wrapper">
              <label>
                <LuArrowUpDown size={16} />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </label>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory + search + sortBy}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="products-grid"
          >
            {sortedProducts.length === 0 ? (
              <motion.div variants={itemVariants} className="products-empty">
                No products found matching your search criteria.
              </motion.div>
            ) : (
              sortedProducts.map((product) => (
                <motion.div key={product.id || product._id || product.name} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default Products;