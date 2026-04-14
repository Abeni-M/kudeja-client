import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, getProducts, addProductReview } from '../services/productService';
import localProducts from '../data/products';
import { normalizeProduct } from '../utils/normalizeProduct';
import { formatPrice } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { LuStar, LuChevronDown, LuChevronUp, LuShoppingCart } from 'react-icons/lu';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import './ProductDetail.css';
import fallbackPlaceholder from '../images/images.jpg';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Accordion states
  const [showDesc, setShowDesc] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  const loadProduct = async () => {
    try {
      const res = await getProduct(id);
      const data = res?.data?.data ?? res?.data?.product ?? res?.data;
      if (data) {
        let norm = normalizeProduct(data);
        const fallback = localProducts.find((p) => String(p.id) === String(id));
        if (!norm.imageUrl || norm.imageUrl.trim() === '' || norm.imageUrl.includes('undefined')) {
          if (fallback && fallback.image) {
            norm.imageUrl = normalizeProduct(fallback).imageUrl;
          } else {
            // Intelligent name-based discovery from bundled assets
            const nameSearch = (norm.name || '').toLowerCase().replace(/dw$/i, '').trim();
            norm.imageUrl = getProductImageUrl(nameSearch) || norm.imageUrl;
          }
        }
        setProduct(norm);
        return;
      }

      const fallback = localProducts.find((p) => String(p.id) === String(id));
      if (fallback) {
        setProduct(normalizeProduct(fallback));
      } else {
        setError('Product not found');
      }
    } catch (err) {
      const fallback = localProducts.find((p) => String(p.id) === String(id));
      if (fallback) {
        setProduct(normalizeProduct(fallback));
      } else {
        setError('Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const res = await getProducts({ limit: 100 });
        let allProds = res?.data?.data || res?.data || [];
        if (!Array.isArray(allProds) || allProds.length === 0) {
          allProds = localProducts;
        }

        allProds = allProds.filter(p => String(p.id) !== String(id));
        const sameCat = allProds.filter(p => p.category === product?.category);
        const otherCat = allProds.filter(p => p.category !== product?.category);

        let combo = sameCat.slice(0, 4);
        // Fill up to 8 products with other categories if needed
        if (combo.length < 8) {
          combo = [...combo, ...otherCat.slice(0, 8 - combo.length)];
        }
        setRelatedProducts(combo.map(normalizeProduct));
      } catch (err) {
        let allProds = localProducts.filter(p => String(p.id) !== String(id));
        const sameCat = allProds.filter(p => p.category === product?.category);
        const otherCat = allProds.filter(p => p.category !== product?.category);

        let combo = sameCat.slice(0, 4);
        if (combo.length < 8) {
          combo = [...combo, ...otherCat.slice(0, 8 - combo.length)];
        }
        setRelatedProducts(combo.map(normalizeProduct));
      }
    };
    fetchRelated();
  }, [product, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating');
    setSubmittingReview(true);
    try {
      await addProductReview(id, { rating, comment });
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      // Reload product to update reviews
      loadProduct();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <section className="product-detail-page">
        <div className="container">
          <div className="products-state">Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="product-detail-page">
        <div className="container">
          <div className="products-state products-state--error">{error}</div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-detail-page">
        <div className="container">
          <div className="products-state products-state--error">Product not found</div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-page">
      <SEO 
        title={product.name} 
        description={product.description || `Buy ${product.name} at Kudeja Trading PLC for ETB ${product.price}. High quality products in Ethiopia.`}
        image={product.imageUrl}
      />
      <div className="container">
        <div className="product-detail-grid">
          <div className="product-info">
            <h1>{product.name}</h1>

            {(() => {
              const reviewsList = Array.isArray(product.reviews) ? product.reviews : (typeof product.reviews === 'string' ? JSON.parse(product.reviews) : []);
              const avg = reviewsList.length ? (reviewsList.reduce((acc, r) => acc + Number(r.rating), 0) / reviewsList.length).toFixed(1) : 0;
              return (
                <div className="product-detail-overall-rating">
                  <div className="product-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <LuStar key={star} size={20} fill={avg >= star ? '#f59e0b' : 'none'} color={avg >= star ? '#f59e0b' : '#d1d5db'} />
                    ))}
                  </div>
                  <span>{avg > 0 ? `${avg} (${reviewsList.length} reviews)` : 'No reviews yet'}</span>
                </div>
              );
            })()}

            <div className="product-meta">
              {product.category ? (
                <span className="product-category">{product.category}</span>
              ) : null}
              <span className={`product-stock-large ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
                {product.stock <= 0 ? 'Out of Stock' : `Stock: ${product.stock}`}
              </span>
            </div>

            {product.description ? (
              <div className="product-description-top">
                <p>{product.description}</p>
              </div>
            ) : null}

            {product.price ? (
              <div className="product-price-large">{formatPrice(product.price)} ETB</div>
            ) : null}

            <div className="shipping-notice">
              <p>Shipping costs are calculated at checkout.</p>
            </div>

            <div className="product-actions">
              <button
                type="button"
                className={`product-detail-btn product-cart-btn ${product.stock <= 0 ? 'btn-disabled' : ''}`}
                onClick={() => product.stock > 0 && addToCart(product, 1)}
                disabled={product.stock <= 0}
                title={product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              >
                <LuShoppingCart size={22} style={{ marginRight: '8px' }} />
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <Link to="/products" className="product-detail-btn product-detail-btn--secondary" title="Back to Products">
                Back
              </Link>
            </div>
          </div>

          <div className="main-image">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name || 'Product'} 
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackPlaceholder; }}
              />
            ) : null}
          </div>
        </div>

        {/* Full-width Detailed Sections below */}
        <div className="product-detail-extra-info">
          {Array.isArray(product.specs) && product.specs.length > 0 && (
            <div className="product-accordion">
              <div className="product-accordion-header" onClick={() => setShowSpecs(!showSpecs)}>
                <h3>Specifications</h3>
                {showSpecs ? <LuChevronUp /> : <LuChevronDown />}
              </div>
              {showSpecs && (
                <div className="product-specs">
                  <ul>
                    {product.specs.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="related-products-section">
              <h3>Related Products</h3>
              <div className="related-products-grid">
                {relatedProducts.map((relProduct) => (
                  <div key={relProduct.id} className="related-product-card-wrap">
                     <ProductCard product={relProduct} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section at the bottom */}
        {(() => {
          const reviewsList = Array.isArray(product.reviews) ? product.reviews : (typeof product.reviews === 'string' ? JSON.parse(product.reviews) : []);
          return (
            <div className="product-detail-reviews-section">
              <h2>Customer Reviews</h2>

              <div className="reviews-list">
                {reviewsList.length === 0 ? (
                  <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviewsList.map((rev, idx) => (
                    <div key={idx} className="review-card">
                      <div className="review-header">
                        <div className="review-author">{rev.userName || 'Anonymous'}</div>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <LuStar key={star} size={14} fill={rev.rating >= star ? '#f59e0b' : 'none'} color={rev.rating >= star ? '#f59e0b' : '#d1d5db'} />
                          ))}
                        </div>
                      </div>
                      <div className="review-date">{new Date(rev.date).toLocaleDateString()}</div>
                      {rev.comment && <p className="review-comment">{rev.comment}</p>}
                    </div>
                  ))
                )}
              </div>

              <div className="review-form-container">
                <h3>Write a Review</h3>
                {!user ? (
                  <p className="login-prompt">Please <Link to="/login">log in</Link> to leave a review.</p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <div className="rating-selector">
                      <span>Your Rating:</span>
                      <div className="feedback-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                          >
                            <LuStar size={24} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      placeholder="Share your thoughts about this product..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="3"
                      className="review-textarea"
                    />
                    <button type="submit" disabled={submittingReview || rating === 0} className="product-detail-btn">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default ProductDetail;