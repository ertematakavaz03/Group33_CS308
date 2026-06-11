// Local SVG placeholder for products without an image. Replaces the dead
// via.placeholder.com host — a data URI can never fail to load, so cards
// always render cleanly even with no image_url.
export const placeholderImage = (name, width = 400, height = 300) => {
  const label = String(name || 'No Image')
    .slice(0, 28)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#f3f4f6"/>` +
    `<text x="50%" y="50%" fill="#9ca3af" font-family="Arial, sans-serif" font-size="${Math.round(height / 12)}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
