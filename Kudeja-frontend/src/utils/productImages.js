// If you put images in `public/images`, they can be referenced by `/images/<filename>`.
// This module also supports bundling images from `src/images` if you create that folder.
const imageModules = import.meta.glob('../images/*.{jpg,jpeg,png,gif,webp}', {
  eager: true,
});

const byFilename = {};
const byNormalized = {};
const byBaseNormalized = {};
const allUrls = [];

function normalizeFilename(name) {
  return String(name ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function splitBaseAndExt(filename) {
  const match = String(filename).match(/^(.*?)(\.[^.]+)?$/);
  return {
    base: match?.[1] ?? String(filename),
    ext: match?.[2] ?? '',
  };
}

for (const path in imageModules) {
  const filename = path.split('/').pop();
  const url = imageModules[path]?.default;
  if (!filename || !url) continue;

  byFilename[filename] = url;
  allUrls.push(url);

  const normalized = normalizeFilename(filename);
  byNormalized[normalized] = url;

  const { base } = splitBaseAndExt(normalized);
  if (!byBaseNormalized[base]) byBaseNormalized[base] = url;
}

function getFallbackImageUrl() {
  return (
    byFilename['images.jpg'] ||
    byFilename['background.png'] ||
    allUrls[0] ||
    ''
  );
}

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function getProductImageUrl(image) {
  if (!image) return getFallbackImageUrl();
  if (isUrl(image)) return image;

  const raw = String(image).trim();
  if (byFilename[raw]) return byFilename[raw];

  const normalized = normalizeFilename(raw);
  if (byNormalized[normalized]) return byNormalized[normalized];

  const { base } = splitBaseAndExt(normalized);
  if (byBaseNormalized[base]) return byBaseNormalized[base];

  // Fallback to public folder image path (works even if you don't bundle images)
  return `/images/${encodeURIComponent(raw)}`;
}

export function enrichProductsWithImages(products = []) {
  if (!Array.isArray(products)) return [];
  return products.map((product) => ({
    ...product,
    imageUrl: product?.imageUrl || getProductImageUrl(product?.image),
  }));
}

