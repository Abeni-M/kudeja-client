import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url }) => {
  const siteTitle = 'Kudeja Trading PLC';
  const defaultDescription = 'Kudeja Trading PLC - The best online e-commerce platform in Ethiopia for high quality electronics, fashion, and accessories.';
  const defaultImage = `${window.location.origin}/logo.png`; // Fallback image if none provided

  const seoTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard SEO tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />

      {/* OpenGraph / Facebook tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
    </Helmet>
  );
};

export default SEO;
