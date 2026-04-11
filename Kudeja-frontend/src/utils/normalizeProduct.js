import { getProductImageUrl } from './productImages';
import { formatPrice } from './formatters';

export function parsePriceToNumber(price) {
  if (typeof price === 'number' && Number.isFinite(price)) return price;
  if (typeof price !== 'string') return null;

  const cleaned = price.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatPriceETB(priceNumber) {
  if (typeof priceNumber !== 'number' || !Number.isFinite(priceNumber)) return '';
  return `ETB ${formatPrice(priceNumber)}`;
}

export function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw._id;
  const image = raw.image ?? raw.image_url ?? raw.imageUrl;
  const rating = raw.rating ?? raw.ratingValue ?? raw.rating_value ?? raw.score;
  const priceNumber = raw.priceNumber ?? parsePriceToNumber(raw.price);
  const priceDisplay = raw.priceDisplay || (priceNumber != null ? formatPriceETB(priceNumber) : raw.price);
  const category = raw.categoryData?.name || raw.category || 'Uncategorized';

  return {
    ...raw,
    category,
    id,
    image,
    rating,
    priceNumber,
    price: priceDisplay,
    imageUrl: raw.imageUrl || getProductImageUrl(image),
  };
}

export function normalizeProductList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct);
}

