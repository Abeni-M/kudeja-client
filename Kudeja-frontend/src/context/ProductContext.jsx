import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getProducts } from '../services/productService';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProducts({ limit: 100 });
      // API returns { success, count, data: [...] }
      const data = res?.data?.data ?? res?.data ?? [];
      setProducts(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products from server');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derive unique categories from DB products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const getProductById = (id) => {
    return products.find(product => String(product.id) === String(id));
  };

  const getProductsByCategory = (category) => {
    if (category === 'All') return products;
    return products.filter(product => product.category === category);
  };

  const searchProducts = (query) => {
    const q = query.toLowerCase();
    return products.filter(product =>
      (product.name || '').toLowerCase().includes(q) ||
      (product.description || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    );
  };

  const value = {
    products,
    loading,
    error,
    categories,
    getProductById,
    getProductsByCategory,
    searchProducts,
    refetch: fetchProducts,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};