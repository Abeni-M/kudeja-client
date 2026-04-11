import React, { createContext, useState, useContext, useEffect } from 'react';
import { normalizeProduct, parsePriceToNumber } from '../utils/normalizeProduct';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    calculateTotals();
  }, [cartItems]);

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => {
      const unit = item.priceNumber ?? parsePriceToNumber(item.price) ?? 0;
      return sum + unit * item.quantity;
    }, 0);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartTotal(total);
    setCartCount(count);
  };

  const addToCart = (product, quantity = 1) => {
    const normalized = normalizeProduct(product || {});
    const productId = normalized.id;
    if (!productId) return;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      const stockLimit = normalized.stock !== undefined && normalized.stock !== null && normalized.stock !== '' ? Number(normalized.stock) : Infinity;
      
      let newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
      
      if (newQuantity > stockLimit) {
        toast.error(`Stock limit reached. Maximum ${stockLimit} allowed.`);
        newQuantity = stockLimit;
      }

      if (existingItem) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            ...normalized,
            id: productId,
            quantity: newQuantity,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => {
      const itemToUpdate = prev.find(i => i.id === productId);
      if (itemToUpdate) {
        const stockLimit = itemToUpdate.stock !== undefined && itemToUpdate.stock !== null && itemToUpdate.stock !== '' ? Number(itemToUpdate.stock) : Infinity;
        if (quantity > stockLimit) {
          toast.error(`Stock limit reached. Maximum ${stockLimit} allowed.`);
          quantity = stockLimit;
        }
      }

      return prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};