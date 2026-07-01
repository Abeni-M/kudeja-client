/**
 * Formats a price number or string with commas and 2 decimal places.
 * Example: 1000 -> "1,000.00"
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || price === '') return '0.00';
  
  let num = price;
  if (typeof price === 'string') {
    // Remove non-numeric characters except for the decimal point
    num = parseFloat(price.replace(/[^0-9.]/g, ''));
  }
  
  if (isNaN(num)) return '0.00';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formats a price with the ETB currency prefix.
 */
export const formatCurrency = (price) => {
  return `ETB ${formatPrice(price)}`;
};
