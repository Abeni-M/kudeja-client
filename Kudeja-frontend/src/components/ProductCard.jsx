import { LuShoppingCart, LuStar } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { normalizeProduct } from '../utils/normalizeProduct';
import { formatPrice } from '../utils/formatters';
import fallbackPlaceholder from '../images/images.jpg';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const normalized = normalizeProduct(product || {});
  const { id, name, price, stock, category, imageUrl, rating } = normalized;
  const productId = id;
  const href = productId ? `/product/${productId}` : null;
  const imgSrc = imageUrl;
  const ratingText = rating ? String(rating) : '';
  const ratingValue = (() => {
    if (typeof rating === 'number' && Number.isFinite(rating)) return rating;
    if (!ratingText) return null;
    const match = ratingText.match(/([0-9]+(\.[0-9]+)?)/);
    return match ? Number.parseFloat(match[1]) : null;
  })();
  const ratingOutOfFive =
    ratingValue == null
      ? null
      : ratingText.includes('/10')
        ? Math.round((ratingValue / 10) * 50) / 10
        : Math.round(ratingValue * 10) / 10;

  return (
    <article className="product-card">
      <div className="product-image">
        {href ? (
          <Link to={href} aria-label={name || 'View product'}>
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt={name || 'Product'} 
                loading="lazy" 
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackPlaceholder; }} 
              />
            ) : null}
          </Link>
        ) : imgSrc ? (
          <img 
            src={imgSrc} 
            alt={name || 'Product'} 
            loading="lazy" 
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackPlaceholder; }}
          />
        ) : null}

        {ratingOutOfFive != null ? (
          <div className="product-rating-header">
            {[1, 2, 3, 4, 5].map((star) => (
              <LuStar
                key={star}
                size={10}
                fill={ratingOutOfFive >= star ? "#fbbf24" : "none"}
                color={ratingOutOfFive >= star ? "#fbbf24" : "#d1d5db"}
              />
            ))}
            <span className="rating-num-card">{ratingOutOfFive}</span>
          </div>
        ) : null}
      </div>

      <div className="product-details">
        <h3 className="product-name">
          {href ? <Link to={href}>{name}</Link> : name}
        </h3>

        <div className="product-price-row">
          {price ? <span className="product-price">{formatPrice(price)}</span> : null}
          {stock ? <span className="product-stock">Stock: {stock}</span> : null}
        </div>

        <div className="product-card-actions">
          <button 
            type="button" 
            className={`btn-add-to-cart btn-cart-icon-only ${stock <= 0 ? 'btn-disabled' : ''}`} 
            onClick={() => stock > 0 && addToCart(normalized, 1)}
            disabled={stock <= 0}
            title={stock <= 0 ? "Out of Stock" : "Add to Cart"}
          >
            <LuShoppingCart size={18} />
          </button>
          {href ? (
            <Link to={href} className="btn-view-compact" title="View Details">
              {stock <= 0 ? 'Out of Stock' : 'View'}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}